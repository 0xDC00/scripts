// ==UserScript==
// @name         [ULJM05054] Kin'iro no Corda
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * 
// * Koei
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

// join 400ms (name slow!)
// string contain custom bytecode (1b ??).
// string splited many parts (normal, color, newline,...);
// need reformat onBeforeTranslate
const mainHandler = trans.send(handler, '400++');

setHook({
    0x886162c: mainHandler, // dialogue: 0x886162c (x1), 0x889d5fc-0x889d520(a2) fullLine
    //0x88daacc: mainHandler, // name: (x1, previous)
    0x8899e90: mainHandler, // name 0x88da57c, 0x8899ca4 (x0, oneTime), 0x8899e90
});

var haveName;
function handler(regs) {
    /** @type NativePointer */
    const address = regs[1].value; // MIPS reg: a1

    if (this.context.pc !== 0x886162c) {
        haveName = true;
        return '\n' + regs[0].value.add(0x3c).readShiftJisString();
    }

    //console.log('onEnter', this.context.pc.toString(16));
    //console.log(hexdump(regs[0].value, { header: false, ansi: false, length: 0x100 }));
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const s = readBinaryString(address);
    //if (s === '\n') return null; // skip empty (no, it's choise)

    return s;
}

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
        // ③④: l+square
        // ⑤⑥: l+triagle
        // ⑫⑬: start
        // ⑰: triagle
        // ⑭: square
        // ⑮: cross
        // ㊤: f
        // ⑳: ～
        // ---
        // γ = ❤️
        // k = triagle
    }
    return s;
});

const encoder = new TextEncoder('shift_jis');
/** @param {NativePointer} address */
function readBinaryString(address) {
    if ((address.readU16() & 0xF0FF) === 0x801b) {
        haveName = true;
        address = address.add(2); // (1)
        console.log('NAME');
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