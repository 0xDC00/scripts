"use strict";

// ==UserScript==
// @name         The Legend of Zelda: Ocarina of Time (Ship of Harkinian) [JP]
// @version      1.0.0
// @author       Rafael Migon
// @description  Extracts and normalizes Japanese Ocarina of Time text from Ship of Harkinian for Agent
// @game         The Legend of Zelda: Ocarina of Time
// @platform     Windows x64
// @engine       Ship of Harkinian
// @language     Japanese
// ==/UserScript==

const SCRIPT_VERSION = "1.0.0";
const LOG_PREFIX = `[SoH/OoT JP v${SCRIPT_VERSION}]`;

const MODULE_NAME = "soh.exe";
const DECODE_FUNCTION = "Message_DecodeJPN";
const SAVE_CONTEXT_SYMBOL = "gSaveContext";

/*
 * Function-address fallback for the currently supported build.
 */
const FALLBACK_DECODE_RVA_9_2_3 = 0xE5F350;

/*
 * Decoded-buffer layout fallback for the currently supported build.
 */
const FALLBACK_DECODED_BUFFER_OFFSET_9_2_3 = 0x1AE9A;

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
 * Set to a string to force a specific player name.
 * Leave as null to read gSaveContext.playerName automatically.
 */
const PLAYER_NAME_OVERRIDE = null;
const PLAYER_NAME_FALLBACK = "リンク";

/*
 * Suppress identical redraws only within this interval.
 * Reopening the same sign or dialogue later still produces output.
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


function tryResolveSymbol(name) {
    const symbol = DebugSymbol.fromName(name);

    if (!symbol.address.isNull()) {
        return symbol;
    }

    /*
     * Some Agent releases bundle a Frida runtime where loading a
     * standalone PDB from debug\ is unsupported or unreliable.
     *
     * If soh.pdb is already discoverable by Windows/Frida, the lookup
     * above succeeds. Otherwise the script continues with the verified
     * build fallback instead of requiring users to move the PDB.
     */
    return symbol;
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
            usedFallback: false
        };
    }

    const fallback = gameModule.base.add(
        FALLBACK_DECODE_RVA_9_2_3
    );

    console.log(
        `${LOG_PREFIX} Using the verified SoH 9.2.3 hook address: ` +
        `${fallback}`
    );

    return {
        address: fallback,
        usedFallback: true
    };
}

const decodeResolution = resolveDecodeFunction();
const decodeAddress = decodeResolution.address;

/*
 * The official 9.2.3 build initializes local pointers near the start
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
function readBytes(address, length) {
    const arrayBuffer = address.readByteArray(length);

    if (arrayBuffer === null) {
        throw new Error(`could not read ${length} bytes at ${address}`);
    }

    return new Uint8Array(arrayBuffer);
}

function findBytePattern(bytes, pattern, startIndex = 0) {
    outer:
    for (
        let index = startIndex;
        index <= bytes.length - pattern.length;
        index++
    ) {
        for (
            let patternIndex = 0;
            patternIndex < pattern.length;
            patternIndex++
        ) {
            const expected = pattern[patternIndex];

            if (
                expected !== null &&
                bytes[index + patternIndex] !== expected
            ) {
                continue outer;
            }
        }

        return index;
    }

    return -1;
}

function readU32FromBytes(bytes, index) {
    return (
        bytes[index] |
        (bytes[index + 1] << 8) |
        (bytes[index + 2] << 16) |
        (bytes[index + 3] << 24)
    ) >>> 0;
}

function discoverDecodedBufferOffset(functionAddress) {
    try {
        const bytes = readBytes(functionAddress, 0x200);

        const basePattern = [
            0x48, 0x05,
            null, null, null, null,
            0x48, 0x89, 0x44, 0x24, 0x30
        ];

        const storePattern = [
            0x66, 0x89, 0x84, 0x4A,
            null, null, null, null
        ];

        const baseIndex = findBytePattern(
            bytes,
            basePattern
        );

        const storeIndex = findBytePattern(
            bytes,
            storePattern
        );

        if (baseIndex < 0 || storeIndex < 0) {
            throw new Error(
                "decoder layout signatures were not found"
            );
        }

        const baseAdjustment = readU32FromBytes(
            bytes,
            baseIndex + 2
        );

        const decodedBufferDisplacement =
            readU32FromBytes(
                bytes,
                storeIndex + 4
            );

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

        return {
            offset: result,
            usedFallback: false
        };
    } catch (error) {
        if (DEBUG) {
            console.log(
                `${LOG_PREFIX} Layout recovery detail: ${error}`
            );
        }

        console.log(
            `${LOG_PREFIX} Using the verified SoH 9.2.3 ` +
            `decoded-buffer offset: ` +
            `0x${FALLBACK_DECODED_BUFFER_OFFSET_9_2_3.toString(16)}`
        );

        return {
            offset:
                FALLBACK_DECODED_BUFFER_OFFSET_9_2_3,
            usedFallback: true
        };
    }
}

const layoutResolution =
    discoverDecodedBufferOffset(decodeAddress);

const decodedBufferOffset =
    layoutResolution.offset;

function getFieldAddress(playState, relativeOffset) {
    return playState
        .add(decodedBufferOffset)
        .add(relativeOffset);
}

const kernel32 = Process.getModuleByName("kernel32.dll");
const MultiByteToWideChar = new NativeFunction(
    kernel32.getExportByName("MultiByteToWideChar"),
    "int",
    ["uint", "uint", "pointer", "int", "pointer", "int"]
);

function decodeCp932(bytes) {
    if (bytes.length === 0) {
        return "";
    }

    const input = Memory.alloc(bytes.length);

    for (let index = 0; index < bytes.length; index++) {
        input.add(index).writeU8(bytes[index]);
    }

    const requiredLength = MultiByteToWideChar(
        932,
        0,
        input,
        bytes.length,
        NULL,
        0
    );

    if (requiredLength <= 0) {
        return "�";
    }

    const output = Memory.alloc((requiredLength + 1) * 2);
    const writtenLength = MultiByteToWideChar(
        932,
        0,
        input,
        bytes.length,
        output,
        requiredLength
    );

    if (writtenLength <= 0) {
        return "�";
    }

    output.add(writtenLength * 2).writeU16(0);

    return output.readUtf16String(writtenLength);
}

function decodeCharacter(code) {
    if (code <= 0x00FF) {
        return decodeCp932([code & 0xFF]);
    }

    return decodeCp932([
        (code >>> 8) & 0xFF,
        code & 0xFF
    ]);
}

/*
 * NTSC Japanese filename character table used by OoT.
 */
const JAPANESE_NAME_TABLE = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り",
    "る", "れ", "ろ", "わ", "を", "ん", "ぁ", "ぃ", "ぅ", "ぇ",
    "ぉ", "っ", "ゃ", "ゅ", "ょ", "が", "ぎ", "ぐ", "げ", "ご",
    "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど",
    "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ",
    "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
    "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト",
    "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ",
    "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ",
    "ル", "レ", "ロ", "ワ", "ヲ", "ン", "ァ", "ィ", "ゥ", "ェ",
    "ォ", "ッ", "ャ", "ュ", "ョ", "ガ", "ギ", "グ", "ゲ", "ゴ",
    "ザ", "ジ", "ズ", "ゼ", "ゾ", "ダ", "ヂ", "ヅ", "デ", "ド",
    "バ", "ビ", "ブ", "ベ", "ボ", "パ", "ピ", "プ", "ペ", "ポ",
    "ヴ"
];

function decodeJapaneseFilenameCharacter(code) {
    if (code < JAPANESE_NAME_TABLE.length) {
        return JAPANESE_NAME_TABLE[code];
    }

    if (code >= 171 && code < 197) {
        return String.fromCharCode(code - 171 + 65);
    }

    if (code >= 197 && code < 223) {
        return String.fromCharCode(code - 197 + 97);
    }

    if (code === 223) {
        return " ";
    }

    if (code === 228) {
        return "-";
    }

    if (code === 234) {
        return ".";
    }

    return "";
}

let cachedPlayerName = null;

function readPlayerName() {
    if (PLAYER_NAME_OVERRIDE !== null) {
        return PLAYER_NAME_OVERRIDE;
    }

    if (cachedPlayerName !== null) {
        return cachedPlayerName;
    }

    const saveContext = tryResolveSymbol(
        SAVE_CONTEXT_SYMBOL
    );

    if (saveContext.address.isNull()) {
        cachedPlayerName = PLAYER_NAME_FALLBACK;
        return cachedPlayerName;
    }

    try {
        const playerNameAddress = saveContext.address.add(0x24);
        const characters = [];

        for (let index = 0; index < 8; index++) {
            const code = playerNameAddress.add(index).readU8();

            if (code === 0xDF) {
                break;
            }

            const character =
                decodeJapaneseFilenameCharacter(code);

            if (character.length > 0) {
                characters.push(character);
            }
        }

        cachedPlayerName =
            characters.length > 0
                ? characters.join("")
                : PLAYER_NAME_FALLBACK;
    } catch (error) {
        if (DEBUG) {
            console.log(
                `${LOG_PREFIX} Player-name read failed: ${error}`
            );
        }

        cachedPlayerName = PLAYER_NAME_FALLBACK;
    }

    return cachedPlayerName;
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
                output.push(readPlayerName());

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

const sendText = trans.send(function (text) {
    return text;
}, "200+");

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
                    `${LOG_PREFIX} Player name: ${readPlayerName()}`
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

if (
    decodeResolution.usedFallback ||
    layoutResolution.usedFallback
) {
    console.log(
        `${LOG_PREFIX} Compatibility mode: official Windows x64 ` +
        "Ship of Harkinian 9.2.3."
    );
}
