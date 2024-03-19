// ==UserScript==
// @name         [010056F00C7B4000] Bravely Default II
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x80b97700 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x80bb8d3c - 0x80004000]: mainHandler.bind_(null, 0, "Main Ptc Text"),
        [0x810add68 - 0x80004000]: mainHandler.bind_(null, 0, "Secondary Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    return s;
}