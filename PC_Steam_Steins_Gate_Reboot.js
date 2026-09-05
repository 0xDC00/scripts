// ==UserScript==
// @name         STEINS;GATE RE:BOOT
// @version      1.0.0.0 (ManifestID: 4900984998756496132)
// @author       Musi
// @description  Steam
// * MAGES. Inc.
// * Spike Chunsoft Co., Ltd.
//
// https://store.steampowered.com/app/4012810/STEINSGATE_REBOOT/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

// markup parser shared by dialogue, tips, and menu/system text
const setTextHook = {
    name: 'setText',
    pattern: '48 8b c4 48 89 58 ?? 55 56 57 41 54 41 55 41 56 41 57 48 8d a8 ?? ?? ?? ?? 48 81 ec ?? ?? ?? ?? 0f 29 70 ?? 0f 29 78 ?? 44 0f 29 40 ?? 44 0f 29 48 ?? 44 0f 29 90 ?? ?? ?? ?? 48 8b 05 ?? ?? ?? ?? 48 33 c4 48 89 85 ?? ?? ?? ?? 44 89 44 24 ?? 4c 8b e2',
};

// the script draws the message board itself, so its posts never reach setText
const structGetHook = {
    name: 'structGet',
    pattern: '48 89 5c 24 08 48 89 6c 24 10 48 89 74 24 20 57 48 83 ec 50 0f 29 74 24 40 48 8b fa 48 8b e9 48 8b ca e8 ?? ?? ?? ?? 83 f8 02 75 ?? 48 8d 4c 24 20 e8 ?? ?? ?? ?? 48 8d 4d 18 e8 ?? ?? ?? ?? 83 e8 06',
};

const pushStringHook = {
    name: 'pushString',
    pattern: '48 85 d2 74 0b 41 b8 ff ff ff ff e9 b0 bc ff ff e9 3b bc ff ff',
};

// the two thunks below this one are identical apart from their jump, so the rel32 has to stay in
const getIntHook = {
    name: 'getInt',
    pattern: '41 8b c0 4c 8b c2 8b d0 e9 f3 b1 ff ff',
};

// element slots on a line record: 0 is the speaker name or post header, 1 is the line itself
const TEXT_INDEX = 1;

// every line is stored once per language and read back in the order JP, EN, TC, SC. the one the
// game is set to is read ~6x, the other three ~3x, so the run length is what picks it out.
const SELECTED_READS = 4;

const CMD_LINE = 'startline';
const CMD_NOTEXT = 'notext'; // the game's own flag for a line the message window must not draw

const BOARD_JOIN_MS = 250; // a post's paragraphs arrive back to back, dialogue lines seconds apart

let lastText = null;
let depth = 0;
let idxOut = null;
let runKey = null;
let runCount = 0;
let runDone = false;
let isNoText = false;
let boardQueue = [];
let boardTimer = null;

function getPatternAddress(hook) {
    const results = Memory.scanSync(__e.base, __e.size, hook.pattern);
    if (results.length === 0) {
        console.error(`[${hook.name}] Hook not found!`);
        return null;
    }
    if (results.length > 1) {
        console.warn(`${hook.name} has ${results.length} results`);
    }
    const address = results[0].address;
    console.log(`[${hook.name}] Found hook ${address}`);
    return address;
}

function cleanMarkup(text) {
    let clean = text.replace(/<tips,\d+,([^>]*)>/g, '$1');
    clean = clean.replace(/\[[^\]]*\]/g, '');                         // strip furigana
    clean = clean.replace(/#[0-9A-Fa-f]*;/g, '');                     // strip color tags (open or close)
    clean = clean.replace(/%[A-Za-z](#[0-9A-Fa-f]{6};|-?\d+;?|;|)/g, ''); // strip remaining tags
    clean = clean.replace(/\\n/g, '\n');                              // \n escape is a real line break
    return clean.trim();
}

function flushBoard() {
    boardTimer = null;
    if (boardQueue.length === 0) return;
    const text = boardQueue.join('\n');
    boardQueue = [];
    handler(text);
}

function queueBoard(clean) {
    if (!clean || boardQueue.indexOf(clean) !== -1) return;
    boardQueue.push(clean);
    clearTimeout(boardTimer);
    boardTimer = setTimeout(flushBoard, BOARD_JOIN_MS);
}

function attachSetText() {
    const setText = getPatternAddress(setTextHook);
    if (setText === null) return;

    Interceptor.attach(setText, {
        onEnter(args) {
            const param3 = args[2].toInt32();
            const isDialogue = param3 === 1 && args[3].toInt32() !== 0; // param4==0 means backlog replay, not a live line

            const text = args[1].readUtf16String();
            if (!text) return;

            // tips: param3==0, everything else (lists, keywords, titles) rejected below
            const isTip = param3 === 0;
            if (!isDialogue && !isTip) return;

            if (text.startsWith('%C')) return; // system/menu box, not dialogue

            const clean = cleanMarkup(text);
            if (!clean) return;

            if (isTip && !clean.includes('\u3002')) return; // tips: only real sentences, no bare titles/keywords/lists
            if (clean === lastText) return; // dedupe backlog re-render
            lastText = clean;

            handler(clean);
        }
    });
}

function attachBoard() {
    const structGet = getPatternAddress(structGetHook);
    if (structGet === null) return;

    const pushString = getPatternAddress(pushStringHook);
    if (pushString === null) return;

    const getInt = getPatternAddress(getIntHook);
    if (getInt === null) return;

    Interceptor.attach(structGet, {
        onEnter() { depth = depth + 1; idxOut = null; },
        onLeave() { depth = depth - 1; }
    });

    Interceptor.attach(getInt, {
        onEnter() { if (depth > 0) idxOut = this.context.rdx; }
    });

    Interceptor.attach(pushString, {
        onEnter() {
            if (depth === 0 || idxOut === null) return;

            let index, raw;
            try {
                index = idxOut.readS32();
                raw = this.context.rdx.readUtf8String();
            } catch (e) {
                return;
            }
            if (!raw) return;

            // each line command resets the flag, only the board's carry notext
            if (raw === CMD_LINE) { isNoText = false; return; }
            if (raw === CMD_NOTEXT) { isNoText = true; return; }

            const key = index + '\u0000' + raw;
            if (key !== runKey) {
                runKey = key;
                runCount = 1;
                runDone = false;
            } else {
                runCount = runCount + 1;
            }

            if (runDone || !isNoText || index !== TEXT_INDEX || runCount < SELECTED_READS) return;
            runDone = true;

            queueBoard(cleanMarkup(raw));
        }
    });
}

attachSetText();
attachBoard();
