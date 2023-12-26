// ==UserScript==
// @name         [PCSG00291] Amagami
// @version      1.00
// @author       [DC]
// @description  
// * Kadokawa
// * K2X_Script
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '300+');

const decoder = new TextDecoder('shift_jis');

setHook({
    0x80070658: mainHandler // String.length()
});

let pre = '';
let format = 0;
function handler(regs) {
    console.warn('onEnter');
    // string object: [[[a0+0x28]]+8]
    const a2 = regs[0];

    // vm = [a0+0x28]
    let vm = a2.value.add(0x28).readU32();
    a2.vm = vm;

    // vm = [vm]
    vm = a2.value.readU32();
    a2.vm = vm;

    // vm = [vm+8]
    vm = a2.value.add(8).readU32();
    a2.vm = vm;

    const address = a2.value; // StringObject
    const len = address.add(4).readU32();
    let p = address.add(0x20);

    //console.warn(hexdump(address, { ansi: false, length: len + 0x20 }));
    //console.log(hexdump(p, { ansi: true, length: len - 1 }));

    if (len > 4 && p.add(2).readU16() === 0) {
        // pink text: [[address+8]+0xC]
        let p1 = address.add(0x8).readU32();
        a2.vm = p1;

        p1 = a2.value.add(0xC).readU32();
        a2.vm = p1;

        p = a2.value;
    }

    let b = format;
    let s = readString(p);

    if (b > 0) {
        // skip PLAYER name
        format--;
        return null;
    }
    if (s.length === 2 && s.trim() === pre.trim() ||
        s[1] === '　' && s[0] === pre[0] && s[s.length - 1] === pre[pre.length - 1]) {
        // skip duplicate name
        return null;
    }
    pre = s;


    return s.length === 0 ? null : s;
}

function readString(address) {
    // skip block start with control; make choice cleaner, may break others. Need test!
    const frist = address.readU16();
    const lo = frist & 0xFF; // uppercase: 41->5A: A... T,W...
    const hi = frist >> 8;
    if (hi === 0 && (lo > 0x5a || lo < 0x41)) {
        return '';
    }

    let s = '', i = 0, c;
    const buf = new Uint8Array(2);
    while ((c = address.add(i).readU16()) !== 0) {
        // reverse endian: ShiftJIS BE => LE
        buf[0] = c >> 8;
        buf[1] = c & 0xFF;

        if (c === 0x815e /* ／ */) {
            s += ' '; // single line

        }
        else if (buf[0] === 0) {
            //// UTF16 LE turned BE: 5700=>0057, 3100, 3500
            //// 4e00 6d00=>PLAYER
            // do nothing
            if (buf[1] === 0x4e) {
                s += 'PLAYER';
                format++;
            }
        }
        else {
            c = decoder.decode(buf)[0];
            s += c;
        }
        i += 2;
    }

    return s;
}