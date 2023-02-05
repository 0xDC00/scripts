// ==UserScript==
// @name         [0100CF400F7CE000] Harukanaru Toki no Naka de 7
// @version      0.1 - 1.0.0
// @author       Koukdw
// @description  Yuzu
// * Koei Tecmo Games
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        0x80102bc: mainHandler.bind_(null, 0, 0), // name
        0x8051f90: mainHandler.bind_(null, 1, 0), // text
        //0x8052794: mainHandler.bind_(null, 0, 0), // text
        0x8010b48: mainHandler.bind_(null, 0, 0), // prompt
        0x8010c80: mainHandler.bind_(null, 0, 0), // choice
        0x8052fa8: mainHandler.bind_(null, 1, 1), // battle guide

    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset) {
    console.log('onEnter ' + ptr(this.context.pc));
    const address = regs[index].value.add(offset);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const s = readString(address)
        .replace(/\n+/g, ' ');

    return s;
}

function readString(address) {
    let s = '', i = 0, c;
    const buf = new Uint8Array(2);
    while ((c = address.add(i).readU8()) !== 0) {
        if (c < 0x20 && c > 0x10) { // skip bytecode: ruby, color,...
            const command = address.add(i + 1).readU8();
            if (command === 0x80) {
                i += 3; // 1b 80 ??
            }
            else if (command === 0xb8) {
                i += 4;
            }
            else {
                const size = address.add(i + 2).readU8();
                i = i + 3 + size;
            }
        }
        else if (c === 0xAA) {
            i += 1;
        }
        else if (c === 0xFF) {
            i += 0x30; // TODO: need test
        }
        else { // read one char
            buf[0] = c;
            buf[1] = address.add(i + 1).readU8();
            c = decoder.decode(buf)[0]; // ShiftJIS: 1->2 bytes.
            s += c;
            i += encoder.encode(c).byteLength;
        }
    }
    return s;
}