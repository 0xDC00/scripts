// ==UserScript==
// @name         [01004B301415A000] Final Fantasy IV
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
        [0x81e44bf4 - 0x80004000]: mainHandler.bind_(null, 0, "main text"), // Main text
        [0x819f92c4 - 0x80004000]: mainHandler.bind_(null, 0, "rolling text"), // Rolling text
        [0x81e2e798 - 0x80004000]: mainHandler.bind_(null, 0, "battle text"), // Battle text
        [0x81b1e6a8 - 0x80004000]: mainHandler.bind_(null, 0, "location"), // Location
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    return s;
}