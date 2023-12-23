// ==UserScript==
// @name         [01002E2014158000] Final Fantasy III
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
        [0x82019e84 - 0x80004000]: mainHandler.bind_(null, 0, "text1"), // Main text1
        [0x817ffcfc - 0x80004000]: mainHandler.bind_(null, 0, "text2"), // Main text2
        [0x81b8b7e4 - 0x80004000]: mainHandler.bind_(null, 0, "battle text"), // battle text
        [0x8192c4a8 - 0x80004000]: mainHandler.bind_(null, 0, "location"), // Location
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