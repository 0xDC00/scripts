// ==UserScript==
// @name         [01000EA014150000] Final Fantasy I
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x81e88040 - 0x80004000]: mainHandler.bind_(null, 0, "main text"), // Main text
        [0x81cae54c - 0x80004000]: mainHandler.bind_(null, 0, "intro text"), // Intro text
        [0x81a3e494 - 0x80004000]: mainHandler.bind_(null, 0, "battle text"), // Battle text
        [0x81952c28 - 0x80004000]: mainHandler.bind_(null, 0, "location"), // Location

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