// ==UserScript==
// @name         [0100D11018A7E000] Angelique Luminarise
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * Koei Tecmo Games
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');

const mainHandler = trans.send(handler, '200+'); // join 200ms
const mainHandler0 = mainHandler.bind_(null, 0);
//const mainHandler1 =  mainHandler.bind_(null, 1);
//const mainHandler1 =  trans.send(handler, 200).bind_(null, 1);
// the last one (but trans.send not support linker yet; so result not join with mainHandler0)
// wrong, conflict with 0x8046c04

setHook({
    '1.0.0': {
        0x8046c04: mainHandler0, // ingameDialogue
        0x8011284: mainHandler0, // choice
        //0x8047164: mainHandler1, // prompt+ingame+previous (unstable)
        0x8011140: mainHandler0, // prompt first
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index) {
    console.log('onEnter ' + ptr(this.context.pc));
    const address = regs[index].value; // x0
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
/*
control bytecode
0xaa
0x1d

like NS_0100DB300B996000_BuddyMissionBOND.js
(Koei Tecmo Games too)
*/