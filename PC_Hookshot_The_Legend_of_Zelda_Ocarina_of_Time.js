// ==UserScript==
// @name         The Legend of Zelda: Ocarina of Time (Hookshot)
// @version      2.1.0
// @author       Guilherme Pressutto
// @description  Hookshot (native PC recompilation of the Nintendo Switch 2 remake), Windows
// * Nintendo
// * Game: program 0400486024DEC000, update v131072, build e0f3ccfa (the only build Hookshot supports)
// * Captures NPC dialogue, signs, Navi, cutscene subtitles and Navi's speech balloons.
// * Not captured yet: item pickup messages (their text is filled in from a variable at layout time).
// ==/UserScript==

/*
 * How this works
 * --------------
 * Hookshot translates the game's AArch64 code to C ahead of time and compiles it on the
 * player's own PC, so the host address of every game function differs between installs.
 * Two things stay fixed (Hookshot's a64-kit runtime, rt/a64.h and rt/a64_rt.c):
 *
 *   1. Guest memory is mapped at the constant host address A64_HOST_BASE (0x100000000000),
 *      so a guest pointer p is at host address A64_HOST_BASE + p.
 *   2. Every lifted function f_<guest address> is listed in two generated tables used for
 *      indirect calls: a sorted `const uint32_t a64_fn_addr[]` (guest addresses) and, right
 *      after it, `const A64Fn a64_fn_ptr[]` (the host functions, in the same order).
 *
 * The script finds those tables in the executable, maps a guest function address to its host
 * function, and hooks it. Each lifted function is `void f_xxxxxxxx(Ctx *c)`, and the guest
 * registers x0..x30 are the first 31 qwords of Ctx.
 *
 * The hooked functions (guest addresses from Hookshot's own game patches, nx2/oot_patches.py):
 *
 *   f_80b1e140  steps a text pane's letter animation (LetterAnimControl, x0): NPC dialogue,
 *               Navi and signs. control +0x28 -> pane wrapper, wrapper +0x08 -> Layout2 pane,
 *               pane +0x08 -> its text box.
 *   f_8152b670  draws a text box (x0), each frame it is shown: used for cutscene subtitles and
 *               Navi's balloons, which have no letter animation.
 *
 *   text box    +0xF0 -> UTF-8 text (guest pointer), +0x124 -> its length in bytes,
 *               +0x108 -> its Layout2 pane names.
 */

const LOG_PREFIX = "[Hookshot/OoT]";

/*
 * Join the text box's manual line breaks into one line (no space between CJK characters,
 * a space otherwise). Set to false to keep the box's line layout.
 */
const JOIN_LINES = true;

const DEBUG = false;

const GUEST_BASE = ptr("0x100000000000");   // A64_HOST_BASE
const GUEST_SPACE = 0x8000000000;           // the 39-bit guest window
const GUEST_CODE_MIN = 0x80000000;          // the image starts here; code lies below 4 GB

const FN_LETTER_ANIM_STEP = 0x80b1e140;
const FN_TEXT_BOX_DRAW = 0x8152b670;

const LETTER_ANIM_WRAPPER = 0x28;
const LETTER_ANIM_RUNNING = 0x70;   // u8: 1 while the page's letters animate, 0 once shown (or idle)
const WRAPPER_PANE = 0x08;
const PANE_TEXT_BOX = 0x08;
const TEXT_BOX_TEXT = 0xF0;
const TEXT_BOX_PANE_NAMES = 0x108;
const TEXT_BOX_LENGTH = 0x124;
const MAX_TEXT_BYTES = 0x10000;

const gameModule = Process.enumerateModules()[0];
const sendText = trans.send(s => s, "200+");

function debug(message) {
    if (DEBUG) console.log(`${LOG_PREFIX} ${message}`);
}

/* A pointer as a JS number (exact below 2^53; NativePointer has no toNumber). */
function pointerNumber(p) {
    return Number(p.toString());
}

/* ---------------------------------------------------------------- guest memory */

function guestPtr(address) {
    if (address <= 0 || address >= GUEST_SPACE) return null;
    return GUEST_BASE.add(address);
}

function guestU64(address) {
    const p = guestPtr(address);
    return p === null ? 0 : p.readU64().toNumber();
}

function guestU32(address) {
    const p = guestPtr(address);
    return p === null ? 0 : p.readU32();
}

/* ---------------------------------------------------------------- lifted function table */

const dataRanges = gameModule.enumerateRanges("r--").filter(r => r.protection[2] !== "x");
const codeRanges = gameModule.enumerateRanges("--x").map(r => {
    const start = pointerNumber(r.base);
    return { start, end: start + r.size };
});

function hexLE32(value) {
    const bytes = [];
    for (let i = 0; i < 4; i++) bytes.push(((value >>> (i * 8)) & 0xFF).toString(16).padStart(2, "0"));
    return bytes.join(" ");
}

function readU32Array(address, count) {
    return new Uint32Array(address.readByteArray(count * 4));
}

/* A run of strictly ascending guest code addresses around `hit`: the a64_fn_addr table. */
function expandAddrTable(hit, range) {
    const CHUNK = 0x4000;   // entries per read
    const rangeStart = range.base;
    const rangeEnd = range.base.add(range.size);

    let start = hit;
    let next = hit.readU32();
    backward: while (start.compare(rangeStart) > 0) {
        const n = Math.min(CHUNK, pointerNumber(start.sub(rangeStart)) / 4);
        if (n < 1) break;
        const values = readU32Array(start.sub(n * 4), n);
        for (let i = n - 1; i >= 0; i--) {
            if (values[i] < GUEST_CODE_MIN || values[i] >= next) break backward;
            next = values[i];
            start = start.sub(4);
        }
    }

    let end = hit.add(4);
    let previous = hit.readU32();
    forward: while (end.compare(rangeEnd) < 0) {
        const n = Math.min(CHUNK, pointerNumber(rangeEnd.sub(end)) / 4);
        if (n < 1) break;
        const values = readU32Array(end, n);
        for (let i = 0; i < n; i++) {
            if (values[i] < GUEST_CODE_MIN || values[i] <= previous) break forward;
            previous = values[i];
            end = end.add(4);
        }
    }

    return { start, count: pointerNumber(end.sub(start)) / 4 };
}

/* The longest ascending run of guest addresses that contains `guestAddress`. */
function findAddrTable(guestAddress) {
    let best = null;
    for (const range of dataRanges) {
        let matches;
        try {
            matches = Memory.scanSync(range.base, range.size, hexLE32(guestAddress));
        } catch (_) {
            continue;
        }
        for (const match of matches) {
            if (!match.address.and(3).isNull()) continue;
            const table = expandAddrTable(match.address, range);
            if (table.count < 1000) continue;   // a stray constant, not the table
            if (best === null || table.count > best.count) best = table;
        }
    }
    return best;
}

function isCodePointer(value) {
    return codeRanges.some(r => value >= r.start && value < r.end);
}

/* Every sampled entry of a candidate a64_fn_ptr table points into the executable's code. */
function looksLikePtrTable(address, count) {
    try {
        const samples = 64;
        for (let s = 0; s <= samples; s++) {
            const index = Math.floor((count - 1) * s / samples);
            if (!isCodePointer(address.add(index * 8).readU64().toNumber())) return false;
        }
        return true;
    } catch (_) {
        return false;
    }
}

/* a64_fn_ptr follows a64_fn_addr in the same generated file, after alignment padding. */
function findPtrTable(addrTable) {
    const end = addrTable.start.add(addrTable.count * 4);
    let candidate = end.add(7).and(ptr(-8));
    for (let gap = 0; gap <= 32; gap += 8, candidate = candidate.add(8)) {
        if (looksLikePtrTable(candidate, addrTable.count)) return candidate;
    }
    return null;
}

function resolveFunctionTable() {
    const addrTable = findAddrTable(FN_LETTER_ANIM_STEP);
    if (addrTable === null) {
        throw new Error(`${LOG_PREFIX} The lifted function table (a64_fn_addr) was not found. ` +
                        `Is this a Hookshot build of the supported game version?`);
    }
    const ptrTable = findPtrTable(addrTable);
    if (ptrTable === null) {
        throw new Error(`${LOG_PREFIX} The lifted function pointers (a64_fn_ptr) were not found.`);
    }
    debug(`a64_fn_addr at ${addrTable.start} (${addrTable.count} functions), a64_fn_ptr at ${ptrTable}`);
    return {
        addresses: readU32Array(addrTable.start, addrTable.count),
        pointers: ptrTable
    };
}

const functionTable = resolveFunctionTable();

function hostFunction(guestAddress) {
    const addresses = functionTable.addresses;
    let low = 0;
    let high = addresses.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (addresses[middle] < guestAddress) low = middle + 1;
        else high = middle;
    }
    if (low >= addresses.length || addresses[low] !== guestAddress) {
        throw new Error(`${LOG_PREFIX} f_${guestAddress.toString(16)} is not a lifted function in this build ` +
                        `(another game version?)`);
    }
    return functionTable.pointers.add(low * 8).readPointer();
}

/* ---------------------------------------------------------------- text */

/*
 * The text is UTF-8 with binary tags in the MSBT style:
 *
 *   0x0E, u16 group, u16 type, u16 parameter size, parameters
 *
 * Seen in game: group 0 type 0 is furigana (its parameters hold the reading; the kanji follow in
 * the text), group 4 names the speaker's animation ("LaughS_00"), group 5 is a pause, group 3
 * is formatting. None of them is visible text, so every tag is dropped. MSBT's closing tag
 * (0x0F, u16 group, u16 type) has not been seen here; it is skipped too, as its zero bytes would
 * otherwise end the text.
 */
const TAG_OPEN = 0x0E;
const TAG_CLOSE = 0x0F;

function stripTags(bytes) {
    const out = [];
    let i = 0;
    while (i < bytes.length) {
        const b = bytes[i];
        if (b === TAG_OPEN && i + 7 <= bytes.length) {
            i += 7 + (bytes[i + 5] | (bytes[i + 6] << 8));
        } else if (b === TAG_CLOSE && i + 5 <= bytes.length) {
            i += 5;
        } else if (b === 0) {
            break;
        } else {
            out.push(b);
            i++;
        }
    }
    return out;
}

function decodeUtf8(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length;) {
        const b = bytes[i];
        let code;
        let n;
        if (b < 0x80) { code = b; n = 1; }
        else if (b >= 0xF0) { code = b & 0x07; n = 4; }
        else if (b >= 0xE0) { code = b & 0x0F; n = 3; }
        else if (b >= 0xC0) { code = b & 0x1F; n = 2; }
        else { i++; continue; }   // a stray continuation byte
        for (let k = 1; k < n; k++) code = (code << 6) | ((bytes[i + k] || 0) & 0x3F);
        s += String.fromCodePoint(code);
        i += n;
    }
    return s;
}

function readTextBox(box) {
    const textAddress = guestU64(box + TEXT_BOX_TEXT);
    const length = guestU32(box + TEXT_BOX_LENGTH);
    if (textAddress === 0 || length === 0 || length > MAX_TEXT_BYTES) return null;
    const text = guestPtr(textAddress);
    if (text === null) return null;
    return decodeUtf8(stripTags(new Uint8Array(text.readByteArray(length))));
}

const CJK = /[\u3000-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

function cleanText(text) {
    let s = text
        .replace(/[\uE000-\uF8FF]/g, "")                          // button / icon glyphs
        .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "");

    if (JOIN_LINES) {
        s = s.replace(/[ \t]*\n+[ \t]*/g, (match, offset, all) => {
            const before = all[offset - 1] || "";
            const after = all[offset + match.length] || "";
            return CJK.test(before) || CJK.test(after) ? "" : " ";
        });
    }

    return s.replace(/[ \t]{2,}/g, " ").trim();
}

/* Layout2 pane names (a text box's +0x108): its own name, then the next one in the layout. */
function paneNames(box) {
    const names = guestPtr(guestU64(box + TEXT_BOX_PANE_NAMES));
    if (names === null) return [];
    const bytes = new Uint8Array(names.readByteArray(64));
    const out = [];
    let current = "";
    for (const b of bytes) {
        if (b > 0x20 && b < 0x7F) {
            current += String.fromCharCode(b);
        } else {
            if (current.length > 0) out.push(current);
            if (out.length === 2) break;
            current = "";
        }
    }
    return out;
}

/*
 * Pane names seen in game:
 *
 *   T_Message_00            cutscene subtitles and NPC dialogue
 *   T_MessageNavi_00        Navi's lines in a conversation
 *   T_Text_00 + N_Navi_00   Navi's speech balloons while walking around
 *   T_Name_00, T_Nickname_00, T_Location_00, T_Guide_00, T_Icon_00, T_Btn_00, other T_Text_00 ...
 *                           speaker names, titles, area names, button hints, menus (not sent)
 */
const STORY_PANES = new Set(["T_Message_00", "T_MessageNavi_00"]);

function isStoryPane(names) {
    if (STORY_PANES.has(names[0])) return true;
    return names[0] === "T_Text_00" && names[1] === "N_Navi_00";
}

/* ---------------------------------------------------------------- sending */

/* A box not seen for this long was closed: the next time it shows, its text is new. */
const BOX_GONE_MS = 500;
/* Some text is drawn by several boxes at once (a cutscene line, a Navi balloon): sent once. */
const SAME_TEXT_WINDOW_MS = 1500;

const boxes = new Map();   // text box guest address -> { text, stableSteps, sent, lastSeen, sticky }
let lastOutput = "";
let lastOutputAt = 0;

/*
 * Each shown box is seen every frame. Its text is sent once it has held the same text for two
 * frames in a row (its previous page may still be there in the first frame after it reopens) and
 * differs from what was last sent for it.
 *
 * sticky (the draw hook's cutscene and balloon boxes): these stop being drawn for a moment during
 * fades and camera cuts with the same line still in them, so being gone does not make their text
 * new again. The letter animation's boxes are not sticky: talking to the same NPC twice, or
 * reading a sign again, sends the text again.
 */
function onBoxText(box, raw, sticky) {
    const now = Date.now();
    let state = boxes.get(box);
    if (state === undefined || (!sticky && now - state.lastSeen > BOX_GONE_MS)) {
        state = { text: null, stableSteps: 0, sent: null, lastSeen: now, sticky };
        boxes.set(box, state);
    }
    state.lastSeen = now;

    if (raw !== state.text) {
        state.text = raw;
        state.stableSteps = 1;
        return;
    }
    if (++state.stableSteps !== 2 || raw === state.sent) return;
    state.sent = raw;

    const output = cleanText(raw);
    if (output.length === 0) return;
    if (output === lastOutput && now - lastOutputAt < SAME_TEXT_WINDOW_MS) return;
    lastOutput = output;
    lastOutputAt = now;
    debug(`box 0x${box.toString(16)} raw: ${JSON.stringify(raw)}`);
    sendText(output);
}

function pruneClosedBoxes() {
    const now = Date.now();
    for (const [box, state] of boxes) {
        if (!state.sticky && now - state.lastSeen > BOX_GONE_MS * 4) boxes.delete(box);
    }
}

/* ---------------------------------------------------------------- hooks */

function attach(name, guestAddress, onEnter) {
    const target = hostFunction(guestAddress);
    Interceptor.attach(target, {
        onEnter(args) {
            try {
                onEnter(args[0]);   // Ctx *: x0..x30 are its first qwords
            } catch (error) {
                debug(`${name}: ${error}`);
            }
        }
    });
    console.log(`${LOG_PREFIX} ${name}: f_${guestAddress.toString(16)} hooked at ${target}`);
}

/* Text boxes with a letter animation: the draw hook leaves them to the letter animation hook. */
const letterAnimBoxes = new Set();

attach("Letter animation (dialogue, Navi, signs)", FN_LETTER_ANIM_STEP, ctx => {
    const control = ctx.readU64().toNumber();   // x0: the LetterAnimControl
    const wrapper = guestU64(control + LETTER_ANIM_WRAPPER);
    const pane = wrapper === 0 ? 0 : guestU64(wrapper + WRAPPER_PANE);
    const box = pane === 0 ? 0 : guestU64(pane + PANE_TEXT_BOX);
    if (box === 0) return;
    letterAnimBoxes.add(box);
    /* Opening a conversation steps every dialogue pane, also hidden ones still holding an old
       page: only a pane whose letters are being shown has its animation flag set */
    if (guestPtr(control + LETTER_ANIM_RUNNING).readU8() === 0) return;
    const text = readTextBox(box);
    if (text !== null) onBoxText(box, text, false);
});

attach("Text box draw (cutscenes, Navi balloons)", FN_TEXT_BOX_DRAW, ctx => {
    const box = ctx.readU64().toNumber();   // x0: the text box
    if (letterAnimBoxes.has(box) || !isStoryPane(paneNames(box))) return;
    const text = readTextBox(box);
    if (text !== null) onBoxText(box, text, true);
});

setInterval(pruneClosedBoxes, 5000);

console.log(`${LOG_PREFIX} Script initialized`);
