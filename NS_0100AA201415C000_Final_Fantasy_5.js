// ==UserScript==
// @name         [0100AA201415C000] Final Fantasy V
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.2': {
        [0x81d63e24 - 0x80004000]: mainHandler.bind_(null, 0, "main text"), // Main text
        [0x81adfb3c - 0x80004000]: mainHandler.bind_(null, 0, "location"), // Location
        [0x81a8fda8 - 0x80004000]: mainHandler.bind_(null, 0, "battle text"), // Battle text
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter', hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    return s;
}