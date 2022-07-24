// ==UserScript==
// @name         [ULJM05428] Kin'iro no Corda 2f
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * 
// * Koei
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

// join 200ms
// string contain custom bytecode (1b ??).
// string splited many parts (normal, color, newline,...);
// need reformat onBeforeTranslate
const mainHandler = trans.send(handler, '200++');

setHook({
    0x89b59dc: mainHandler,
});

function handler(regs) {
    /** @type NativePointer */
    const address = regs[1].value; // MIPS reg: a1

    //console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const s = readBinaryString(address);
    //if (s === '\n') return null; // skip empty (no, it's choise)

    return s;
}

var haveName;
trans.replace(function (s) {
    s = s.trim();
    if (haveName === true) {
        haveName = false;

        const index = s.lastIndexOf('\n');
        const dialogue = s.substring(0, index).replace(/\n+/g, ' '); // single line;
        const name = s.substring(index + 1);

        if (name === '＊＊＊') // 81 96 81 96 81 96 0A
            return dialogue; // menu

        s = name + '\r\n' + dialogue;

        /* processString */
        // ㊤: f
        // ⑰: triagle
    }
    return s;
});

const encoder = new TextEncoder('shift_jis');
/** @param {NativePointer} address */
function readBinaryString(address) {
    if ((address.readU16() & 0xF0FF) === 0x801b) {
        haveName = true;
        address = address.add(2); // (1)
    }

    let s = '', i = 0;
    let c;
    while ((c = address.add(i).readU8()) !== 0) {
        if (c == 0x1b) {
            if (haveName)
                return s; // (1) skip junk after name

            c = address.add(i + 1).readU8();
            if (c === 0x7f)
                i += 5;
            else
                i += 2;
        }
        else if (c === 0x0a) {
            s += '\n';
            i += 1;
        }
        else if (c === 0x20) {
            s += ' ';
            i += 1;
        }
        else {
            // s += address.add(i).readShiftJisString(2);
            // i += 2;

            // ShiftJIS: 1->2 bytes
            c = address.add(i).readShiftJisString(2)[0];
            s += c;
            i += encoder.encode(c).byteLength;
        }
    }

    return s;
}