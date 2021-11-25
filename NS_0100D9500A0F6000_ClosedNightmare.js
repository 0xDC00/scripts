// ==UserScript==
// @name         [0100D9500A0F6000] Closed Nightmare
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * Nippon Ichi Software, Inc.
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        0x80c0918: mainHandler, // line + name
        0x8070b98: mainHandler, // fast trophy
        0x80878fc: mainHandler, // prompt
        0x8087aa0: mainHandler  // choice
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value; // x0

    console.log('onEnter');
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readUtf8String()
        .replace(/㊤|㊥/g, '―')
        .replace(/^㌻/g, ' ') // \n
        ;

    return s;
}