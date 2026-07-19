// ==UserScript==
// @name         The Legend of Zelda: Ocarina of Time (Ship of Harkinian) [JP]
// @version      9.2.3
// @author       Rafael Migon
// @description  Ship of Harkinian 9.2.3, Japanese OoT ROM 1.0
// ==/UserScript==

const LOG_PREFIX = `[SoH/OoT JP]`;

const MODULE_NAME = "soh.exe";
const DECODE_FUNCTION = "Message_DecodeJPN";

/*
 * Offsets relative to MessageContext::msgBufDecodedWide.
 *
 * These relationships come directly from the MessageContext layout:
 *
 *   textId             = decoded buffer - 0x0E
 *   textBoxType        = decoded buffer - 0x09
 *   decodedTextLen     = decoded buffer + 0xCE
 *   textboxEndType     = decoded buffer + 0xDE
 *   choiceNum          = decoded buffer + 0xE0
 *
 * Unlike a PlayState-relative address, these remain local to the
 * MessageContext structure.
 */
const FIELD_FROM_DECODED_BUFFER = Object.freeze({
    TEXT_ID: -0x0E,
    TEXTBOX_TYPE: -0x09,
    DECODED_TEXT_LEN: 0xCE,
    TEXTBOX_END_TYPE: 0xDE,
    CHOICE_NUM: 0xE0
});

/*
 * Output modes:
 *
 * "translation"
 *   Removes visual alignment spaces, joins likely textbox wrapping,
 *   preserves sentence boundaries, preserves wooden-sign headings,
 *   and keeps choice options on separate lines.
 *
 * "display"
 *   Preserves the visible textbox line layout.
 */
const OUTPUT_MODE = "translation";

/*
 * Japanese OoT normally uses リンク as the player name.
 *
 * Custom save names are intentionally not resolved because doing so
 * would require another build-specific global or optional debug symbol.
 */
const PLAYER_NAME = "リンク";

/*
 * Suppress identical redraws only within this interval.
 * Reopening the same sign or dialogue later still produces output.
 *
 * The dedup key includes textId, textbox type, end type, choice count,
 * and the decoded output text, so distinct pages are never suppressed
 * even if they occur inside the same window.
 *
 * This value was chosen conservatively to cover repeated
 * decoding/redraw calls for the same page, not measured against actual
 * page-turn timing. A legitimate reopening of the exact same page
 * within this window would still be suppressed; if that turns out to
 * matter in practice, narrow this after observing how often SoH
 * repeats the decoder callback for a single page.
 */
const DUPLICATE_WINDOW_MS = 1000;

/*
 * Enable detailed console logging.
 */
const DEBUG = false;

const MAX_DECODED_CODE_UNITS = 100;
const MAX_REASONABLE_DECODED_LENGTH = 99;

const TEXTBOX_TYPE = Object.freeze({
    BLACK: 0,
    WOODEN: 1,
    BLUE: 2,
    OCARINA: 3,
    NONE_BOTTOM: 4,
    NONE_NO_SHADOW: 5,
    CREDITS: 11
});

const TEXTBOX_END_TYPE = Object.freeze({
    DEFAULT: 0x00,
    TWO_CHOICE: 0x10,
    THREE_CHOICE: 0x20,
    HAS_NEXT: 0x30,
    PERSISTENT: 0x40,
    EVENT: 0x50,
    FADING: 0x60
});

const CONTROL = Object.freeze({
    NEWLINE: 0x000A,
    COLOR: 0x000B,

    SPACE: 0x8140,
    END: 0x8170,

    QUICKTEXT_ENABLE: 0x8189,
    QUICKTEXT_DISABLE: 0x818A,

    UNSKIPPABLE: 0x8199,
    ITEM_ICON: 0x819A,
    FADE: 0x819E,
    EVENT: 0x819F,

    TIME: 0x81A1,
    BOX_BREAK_DELAYED: 0x81A3,
    AWAIT_BUTTON: 0x81A4,
    BOX_BREAK: 0x81A5,

    THREE_CHOICE: 0x81B8,
    TWO_CHOICE: 0x81BC,
    TEXT_ID: 0x81CB,

    OCARINA: 0x81F0,
    SFX: 0x81F3,
    FADE_2: 0x81F4,

    HIGHSCORE: 0x869F,
    TOKENS: 0x86A3,
    FISH_INFO: 0x86A4,

    BACKGROUND: 0x86B3,
    SHIFT: 0x86C7,
    PERSISTENT: 0x86C8,
    TEXT_SPEED: 0x86C9,

    NAME: 0x874F,
    MARATHON_TIME: 0x8791,
    RACE_TIME: 0x8792,
    POINTS: 0x879B
});

const gameModule = Process.getModuleByName(MODULE_NAME);

/*
 * Frida Memory.scanSync() pattern strings, shared across every
 * signature-matching step below. "??" marks a wildcard byte.
 *
 *   BASE_PATTERN  -> local PlayState base adjustment
 *   STORE_PATTERN -> displacement to msgBufDecodedWide from that base
 */
const BASE_PATTERN = "48 05 ?? ?? ?? ?? 48 89 44 24 30";
/*
 * Frida's Memory.scanSync() pattern syntax cannot start or end with a
 * wildcard, so STORE_PATTERN only encodes the concrete opcode prefix.
 * The four displacement bytes that follow (previously represented as
 * trailing "?? ?? ?? ??") aren't part of the match at all — every call
 * site reads them separately via match.address.add(4).readU32(),
 * which lands in the same place either way.
 */
const STORE_PATTERN = "66 89 84 4A";

/*
 * Message_DecodeJPN handles many Japanese message-control values
 * directly. Their little-endian constants help distinguish it from
 * other functions that happen to use the same 16-bit indexed-store
 * instruction.
 */
const JAPANESE_CONTROL_CONSTANT_PATTERNS = [
    "70 81", // MESSAGE_END_JPN        0x8170
    "A5 81", // MESSAGE_BOX_BREAK_JPN  0x81A5
    "C7 86", // MESSAGE_SHIFT_JPN      0x86C7
    "C9 86", // MESSAGE_TEXT_SPEED_JPN 0x86C9
    "4F 87", // MESSAGE_NAME_JPN       0x874F
    "F3 81", // MESSAGE_SFX_JPN        0x81F3
    "BC 81", // MESSAGE_TWO_CHOICE_JPN 0x81BC
    "B8 81"  // MESSAGE_THREE_CHOICE_JPN 0x81B8
];

function tryResolveSymbol(name) {
    return DebugSymbol.fromName(name);
}

/*
 * Windows x64 executables describe function boundaries in the PE
 * exception directory (.pdata). This lets the script recover the
 * beginning of the function containing a decoder-specific instruction,
 * without depending on a compiler-generated function prologue.
 */
function getRuntimeFunctionTable() {
    const moduleBase = gameModule.base;
    const peHeaderOffset = moduleBase.add(0x3C).readU32();
    const ntHeaders = moduleBase.add(peHeaderOffset);

    if (ntHeaders.readU32() !== 0x00004550) {
        throw new Error("invalid PE signature");
    }

    const optionalHeader = ntHeaders.add(0x18);
    const optionalHeaderMagic = optionalHeader.readU16();

    if (optionalHeaderMagic !== 0x20B) {
        throw new Error(
            "expected a 64-bit PE optional header"
        );
    }

    /*
     * IMAGE_OPTIONAL_HEADER64.DataDirectory starts at 0x70.
     * IMAGE_DIRECTORY_ENTRY_EXCEPTION is directory index 3.
     */
    const exceptionDirectory =
        optionalHeader.add(0x70 + (3 * 8));

    const tableRva = exceptionDirectory.readU32();
    const tableSize = exceptionDirectory.add(4).readU32();

    if (tableRva === 0 || tableSize < 12) {
        throw new Error(
            "the PE exception directory is unavailable"
        );
    }

    return {
        address: moduleBase.add(tableRva),
        count: Math.floor(tableSize / 12)
    };
}

function findEnclosingFunction(instructionAddress) {
    const instructionRva = instructionAddress
        .sub(gameModule.base)
        .toUInt32();

    const table = getRuntimeFunctionTable();

    let low = 0;
    let high = table.count - 1;

    while (low <= high) {
        const middle = (low + high) >>> 1;
        const entry = table.address.add(middle * 12);
        const beginRva = entry.readU32();
        const endRva = entry.add(4).readU32();

        if (instructionRva < beginRva) {
            high = middle - 1;
        } else if (instructionRva >= endRva) {
            low = middle + 1;
        } else {
            return {
                address: gameModule.base.add(beginRva),
                size: endRva - beginRva
            };
        }
    }

    throw new Error(
        `no runtime-function entry contains ${instructionAddress}`
    );
}

function scoreDecodeFunctionCandidate(functionInfo) {
    try {
        const scanSize = Math.min(functionInfo.size, 0x1200);

        const hasBasePattern = Memory.scanSync(
            functionInfo.address,
            scanSize,
            BASE_PATTERN
        ).length > 0;

        const hasStorePattern = Memory.scanSync(
            functionInfo.address,
            scanSize,
            STORE_PATTERN
        ).length > 0;

        if (!hasBasePattern || !hasStorePattern) {
            return -1;
        }

        let score = 0;

        for (const pattern of JAPANESE_CONTROL_CONSTANT_PATTERNS) {
            const matches = Memory.scanSync(
                functionInfo.address,
                scanSize,
                pattern
            );

            if (matches.length > 0) {
                score += 2;
            }
        }

        /*
         * Prefer the full decoder over small helper functions or
         * similarly-shaped message routines.
         */
        if (functionInfo.size >= 0x800) {
            score += 3;
        } else if (functionInfo.size >= 0x400) {
            score += 1;
        }

        return score;
    } catch (_) {
        return -1;
    }
}

function findDecodeFunctionByInstructionPattern() {
    const candidates = new Map();
    const ranges = gameModule.enumerateRanges("r-x");

    for (const range of ranges) {
        const matches = Memory.scanSync(
            range.base,
            range.size,
            STORE_PATTERN
        );

        for (const match of matches) {
            const instructionAddress = match.address;

            let functionInfo;

            try {
                functionInfo = findEnclosingFunction(
                    instructionAddress
                );
            } catch (_) {
                continue;
            }

            const key = functionInfo.address.toString();

            if (candidates.has(key)) {
                continue;
            }

            const score =
                scoreDecodeFunctionCandidate(functionInfo);

            if (score < 0) {
                continue;
            }

            candidates.set(key, {
                address: functionInfo.address,
                size: functionInfo.size,
                score
            });
        }
    }

    const ranked = Array.from(candidates.values())
        .sort((left, right) => right.score - left.score);

    if (DEBUG) {
        for (const candidate of ranked) {
            console.log(
                `${LOG_PREFIX} Decoder candidate ` +
                `${candidate.address}, size=0x` +
                `${candidate.size.toString(16)}, ` +
                `score=${candidate.score}`
            );
        }
    }

    if (ranked.length === 0) {
        return NULL;
    }

    if (
        ranked.length > 1 &&
        ranked[0].score === ranked[1].score
    ) {
        throw new Error(
            `${LOG_PREFIX} Found multiple equally ranked ` +
            `${DECODE_FUNCTION} candidates; refusing to choose ` +
            `an ambiguous hook address. Enable DEBUG for details.`
        );
    }

    /*
     * Require evidence from several Japanese control constants. This
     * prevents a weak structural match from being selected merely
     * because it has the highest score among unrelated functions.
     */
    if (ranked[0].score < 7) {
        throw new Error(
            `${LOG_PREFIX} The best ${DECODE_FUNCTION} candidate ` +
            `did not contain enough Japanese-decoder evidence. ` +
            `Enable DEBUG for details.`
        );
    }

    return ranked[0].address;
}

function resolveDecodeFunction() {
    const symbol = tryResolveSymbol(DECODE_FUNCTION);

    if (!symbol.address.isNull()) {
        console.log(
            `${LOG_PREFIX} Resolved ${DECODE_FUNCTION}: ${symbol.address}`
        );

        if (symbol.fileName) {
            const line = symbol.lineNumber
                ? `:${symbol.lineNumber}`
                : "";

            console.log(
                `${LOG_PREFIX} Source: ${symbol.fileName}${line}`
            );
        }

        return {
            address: symbol.address,
            method: "symbol"
        };
    }

    const patternAddress =
        findDecodeFunctionByInstructionPattern();

    if (!patternAddress.isNull()) {
        console.log(
            `${LOG_PREFIX} Located ${DECODE_FUNCTION} from ` +
            `decoder instructions: ${patternAddress}`
        );

        return {
            address: patternAddress,
            method: "instruction-pattern"
        };
    }

    throw new Error(
        `${LOG_PREFIX} Unsupported Ship of Harkinian build: ` +
        `${DECODE_FUNCTION} could not be located through debug ` +
        `symbols or validated decoder instructions.`
    );
}

const decodeResolution = resolveDecodeFunction();
const decodeAddress = decodeResolution.address;

/*
 * Compatible builds initialize local pointers near the start
 * of Message_DecodeJPN like this:
 *
 *   play + <base adjustment>
 *   ...
 *   msgBufDecodedWide[decodedPosition] = currentCharacter
 *
 * The first signature yields the local PlayState base adjustment.
 * The second yields the displacement to msgBufDecodedWide from that
 * adjusted base. Their sum is the decoded-buffer PlayState offset.
 */
function discoverDecodedBufferOffset(functionAddress) {
    try {
        const scanSize = 0x200;

        const baseMatches = Memory.scanSync(
            functionAddress,
            scanSize,
            BASE_PATTERN
        );

        const storeMatches = Memory.scanSync(
            functionAddress,
            scanSize,
            STORE_PATTERN
        );

        if (baseMatches.length === 0 || storeMatches.length === 0) {
            throw new Error(
                "decoder layout signatures were not found"
            );
        }

        const baseAdjustment = baseMatches[0].address
            .add(2)
            .readU32();

        const decodedBufferDisplacement = storeMatches[0].address
            .add(4)
            .readU32();

        const result =
            baseAdjustment + decodedBufferDisplacement;

        if (result < 0x1000 || result > 0x400000) {
            throw new Error(
                `recovered offset 0x${result.toString(16)} ` +
                `is implausible`
            );
        }

        console.log(
            `${LOG_PREFIX} Recovered decoded-buffer offset: ` +
            `0x${result.toString(16)}`
        );

        return result;
    } catch (error) {
        throw new Error(
            `${LOG_PREFIX} Unsupported Ship of Harkinian build: ` +
            `the Japanese decoded-buffer layout could not be recovered. ` +
            `Details: ${error}`
        );
    }
}

const decodedBufferOffset =
    discoverDecodedBufferOffset(decodeAddress);

function getFieldAddress(playState, relativeOffset) {
    return playState
        .add(decodedBufferOffset)
        .add(relativeOffset);
}

/*
 * msgBufDecodedWide is not a normal Shift-JIS byte string: it contains
 * 16-bit CP932 values interleaved with message control codes. Visible
 * character bytes are rebuilt first, then Agent's built-in decoder is
 * used for the final conversion.
 */
function decodeShiftJis(bytes, originalCode) {
    if (bytes.length === 0) {
        return "";
    }

    const buffer = Memory.alloc(bytes.length + 1);

    for (let index = 0; index < bytes.length; index++) {
        buffer.add(index).writeU8(bytes[index]);
    }

    buffer.add(bytes.length).writeU8(0);

    try {
        return buffer.readShiftJisString();
    } catch (error) {
        if (DEBUG) {
            const codeHex = originalCode !== undefined
                ? `0x${originalCode.toString(16).padStart(4, "0")}`
                : "unknown";

            const bytesHex = Array.from(bytes)
                .map(byte => byte.toString(16).padStart(2, "0"))
                .join(" ");

            console.warn(
                `${LOG_PREFIX} Shift-JIS decode failed for code=` +
                `${codeHex} (bytes: ${bytesHex}): ${error}`
            );
        }

        return "�";
    }
}

function decodeCharacter(code) {
    if (code <= 0x00FF) {
        return decodeShiftJis([code & 0xFF], code);
    }

    return decodeShiftJis([
        (code >>> 8) & 0xFF,
        code & 0xFF
    ], code);
}

function readMetadata(playState) {
    return {
        textId: getFieldAddress(
            playState,
            FIELD_FROM_DECODED_BUFFER.TEXT_ID
        ).readU16(),

        textBoxType: getFieldAddress(
            playState,
            FIELD_FROM_DECODED_BUFFER.TEXTBOX_TYPE
        ).readU8(),

        decodedTextLen: getFieldAddress(
            playState,
            FIELD_FROM_DECODED_BUFFER.DECODED_TEXT_LEN
        ).readU16(),

        textboxEndType: getFieldAddress(
            playState,
            FIELD_FROM_DECODED_BUFFER.TEXTBOX_END_TYPE
        ).readU8(),

        choiceNum: getFieldAddress(
            playState,
            FIELD_FROM_DECODED_BUFFER.CHOICE_NUM
        ).readU8()
    };
}

/*
 * FIELD_FROM_DECODED_BUFFER's offsets are fixed constants derived from
 * the observed MessageContext layout — unlike decodeAddress and
 * decodedBufferOffset, they are not re-derived from signatures on
 * each run. A future SoH build could keep the decoder instructions
 * this script signature-matches on while still moving these nearby
 * fields, which would let resolveDecodeFunction succeed while
 * metadata is silently read from the wrong offsets.
 *
 * This is a plausibility check, not a correctness guarantee: a
 * shifted offset could still coincidentally land on values that pass.
 * Its purpose is to catch the common case — an offset landing in
 * clearly wrong territory — and fail loudly instead of feeding
 * corrupted metadata into cleanTranslationText.
 */
function isMetadataPlausible(metadata) {
    const knownTextBoxTypes = Object.values(TEXTBOX_TYPE);
    const knownEndTypes = Object.values(TEXTBOX_END_TYPE);

    return (
        knownTextBoxTypes.includes(metadata.textBoxType) &&
        knownEndTypes.includes(metadata.textboxEndType) &&
        metadata.choiceNum <= 3 &&
        metadata.decodedTextLen <= MAX_REASONABLE_DECODED_LENGTH
    );
}

function getReadLimit(decodedTextLen) {
    if (
        decodedTextLen > 0 &&
        decodedTextLen <= MAX_REASONABLE_DECODED_LENGTH
    ) {
        return Math.min(
            decodedTextLen + 1,
            MAX_DECODED_CODE_UNITS
        );
    }

    return MAX_DECODED_CODE_UNITS;
}

function readDecodedPage(playState, metadata) {
    const buffer = playState.add(decodedBufferOffset);
    const output = [];
    const readLimit = getReadLimit(
        metadata.decodedTextLen
    );

    for (let index = 0; index < readLimit; index++) {
        const code = buffer.add(index * 2).readU16();

        switch (code) {
            case CONTROL.NEWLINE:
                output.push("\n");
                break;

            case CONTROL.SPACE:
                output.push("\u3000");
                break;

            case CONTROL.NAME:
                output.push(PLAYER_NAME);

                while (
                    index + 1 < readLimit &&
                    buffer.add((index + 1) * 2).readU16() ===
                        CONTROL.NAME
                ) {
                    index++;
                }

                break;

            /*
             * Controls with one parameter in the decoded buffer.
             */
            case CONTROL.COLOR:
            case CONTROL.SHIFT:
            case CONTROL.FADE:
            case CONTROL.SFX:
            case CONTROL.ITEM_ICON:
            case CONTROL.TEXT_SPEED:
                index++;
                break;

            /*
             * Background formatting has two parameters.
             */
            case CONTROL.BACKGROUND:
                index += 2;
                break;

            /*
             * Page terminators.
             */
            case CONTROL.TEXT_ID:
            case CONTROL.BOX_BREAK_DELAYED:
            case CONTROL.END:
            case CONTROL.BOX_BREAK:
            case CONTROL.EVENT:
                return output.join("");

            /*
             * Non-visible state and formatting controls.
             */
            case CONTROL.QUICKTEXT_ENABLE:
            case CONTROL.QUICKTEXT_DISABLE:
            case CONTROL.PERSISTENT:
            case CONTROL.AWAIT_BUTTON:
            case CONTROL.OCARINA:
            case CONTROL.FADE_2:
            case CONTROL.UNSKIPPABLE:
            case CONTROL.TWO_CHOICE:
            case CONTROL.THREE_CHOICE:
                break;

            /*
             * Message_DecodeJPN normally expands these into visible
             * digits before returning. Labels are safe fallbacks.
             */
            case CONTROL.TIME:
                output.push("[TIME]");
                break;

            case CONTROL.HIGHSCORE:
                output.push("[HIGHSCORE]");
                index++;
                break;

            case CONTROL.TOKENS:
                output.push("[TOKENS]");
                break;

            case CONTROL.FISH_INFO:
                output.push("[FISH]");
                break;

            case CONTROL.MARATHON_TIME:
                output.push("[MARATHON TIME]");
                break;

            case CONTROL.RACE_TIME:
                output.push("[RACE TIME]");
                break;

            case CONTROL.POINTS:
                output.push("[POINTS]");
                break;

            default:
                output.push(decodeCharacter(code));
                break;
        }
    }

    return output.join("");
}

function normalizeVisibleLines(text) {
    return text
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.replace(/[ \t\u3000]+/g, ""))
        .filter(line => line.length > 0);
}

function endsWithSentenceBoundary(text) {
    return /[。！？!?…‥」』）】]$/.test(text);
}

function joinWrappedLines(lines) {
    if (lines.length === 0) {
        return "";
    }

    const paragraphs = [];
    let current = lines[0];

    for (let index = 1; index < lines.length; index++) {
        const next = lines[index];

        if (endsWithSentenceBoundary(current)) {
            paragraphs.push(current);
            current = next;
        } else {
            current += next;
        }
    }

    paragraphs.push(current);

    return paragraphs.join("\n");
}

function normalizeWoodenSign(lines) {
    if (lines.length <= 1) {
        return lines.join("");
    }

    const heading = lines[0];
    const body = joinWrappedLines(lines.slice(1));

    return body.length > 0
        ? `${heading}\n${body}`
        : heading;
}

function normalizeChoices(lines, choiceCount) {
    const safeChoiceCount = Math.min(
        Math.max(choiceCount, 0),
        lines.length
    );

    if (safeChoiceCount < 2) {
        return joinWrappedLines(lines);
    }

    const promptLines = lines.slice(
        0,
        lines.length - safeChoiceCount
    );
    const choiceLines = lines.slice(
        lines.length - safeChoiceCount
    );

    const prompt = joinWrappedLines(promptLines);
    const choices = choiceLines.join("\n");

    return prompt.length > 0
        ? `${prompt}\n${choices}`
        : choices;
}

function normalizeLayoutSensitiveText(lines) {
    return lines.join("\n");
}

function cleanDisplayText(text) {
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function cleanTranslationText(text, metadata) {
    const lines = normalizeVisibleLines(text);

    if (lines.length === 0) {
        return "";
    }

    const choiceCount =
        metadata.textboxEndType ===
            TEXTBOX_END_TYPE.TWO_CHOICE
            ? 2
            : metadata.textboxEndType ===
                  TEXTBOX_END_TYPE.THREE_CHOICE
              ? 3
              : metadata.choiceNum >= 2
                ? metadata.choiceNum
                : 0;

    if (choiceCount >= 2) {
        return normalizeChoices(lines, choiceCount);
    }

    switch (metadata.textBoxType) {
        case TEXTBOX_TYPE.WOODEN:
            return normalizeWoodenSign(lines);

        case TEXTBOX_TYPE.OCARINA:
        case TEXTBOX_TYPE.NONE_BOTTOM:
        case TEXTBOX_TYPE.NONE_NO_SHADOW:

        /*
         * CREDITS was verified against a full playthrough of the
         * ending (post-Ganon dialogue through Zelda sending Link
         * back). It shares NONE_BOTTOM/NONE_NO_SHADOW's layout
         * handling correctly. The English credits scroll itself
         * isn't routed through Message_DecodeJPN, so it produces no
         * output — that's expected, not a missed case.
         */
        case TEXTBOX_TYPE.CREDITS:
            return normalizeLayoutSensitiveText(lines);

        case TEXTBOX_TYPE.BLACK:
        case TEXTBOX_TYPE.BLUE:
        default:
            return joinWrappedLines(lines);
    }
}

function prepareOutput(text, metadata) {
    if (OUTPUT_MODE === "display") {
        return cleanDisplayText(text);
    }

    return cleanTranslationText(text, metadata).trim();
}

let previousKey = "";
let previousTimestamp = 0;

function isDuplicateWithinWindow(key) {
    const now = Date.now();

    if (
        key === previousKey &&
        now - previousTimestamp < DUPLICATE_WINDOW_MS
    ) {
        return true;
    }

    previousKey = key;
    previousTimestamp = now;

    return false;
}

const sendText = trans.send(s => s);

Interceptor.attach(decodeAddress, {
    onEnter(args) {
        this.playState = args[0];
    },

    onLeave() {
        if (
            this.playState === undefined ||
            this.playState.isNull()
        ) {
            return;
        }

        try {
            const metadata = readMetadata(this.playState);

            if (!isMetadataPlausible(metadata)) {
                console.warn(
                    `${LOG_PREFIX} Implausible metadata (textBoxType=` +
                    `${metadata.textBoxType}, endType=` +
                    `${metadata.textboxEndType}, choiceNum=` +
                    `${metadata.choiceNum}, decodedTextLen=` +
                    `${metadata.decodedTextLen}) — MessageContext ` +
                    `layout may have shifted for this build. Skipping ` +
                    `this callback.`
                );
                return;
            }

            const rawText = readDecodedPage(
                this.playState,
                metadata
            );
            const output = prepareOutput(
                rawText,
                metadata
            );

            if (output.length === 0) {
                return;
            }

            const key = [
                metadata.textId,
                metadata.textBoxType,
                metadata.textboxEndType,
                metadata.choiceNum,
                output
            ].join(":");

            if (isDuplicateWithinWindow(key)) {
                return;
            }

            if (DEBUG) {
                console.log(
                    `${LOG_PREFIX} textId=0x` +
                    `${metadata.textId
                        .toString(16)
                        .padStart(4, "0")}, ` +
                    `type=${metadata.textBoxType}, ` +
                    `end=${metadata.textboxEndType}, ` +
                    `choices=${metadata.choiceNum}, ` +
                    `decodedLen=${metadata.decodedTextLen}`
                );

                console.log(
                    `${LOG_PREFIX} Raw:\n` +
                    `${cleanDisplayText(rawText)}`
                );

                console.log(
                    `${LOG_PREFIX} Sent:\n${output}`
                );
            }

            sendText(output);
        } catch (error) {
            console.error(
                `${LOG_PREFIX} Extraction failed: ${error}`
            );
        }
    }
});

console.log(
    `${LOG_PREFIX} Script initialized`
);

console.log(
    `${LOG_PREFIX} ${DECODE_FUNCTION} hooked at ${decodeAddress}`
);
console.log(
    `${LOG_PREFIX} Decoded buffer offset: ` +
    `0x${decodedBufferOffset.toString(16)}`
);
console.log(
    `${LOG_PREFIX} Output mode: ${OUTPUT_MODE}`
);
