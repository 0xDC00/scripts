// ==UserScript==
// @name         [0100C2901153C000] Yoru, Tomosu
// @version      1.0.0
// @author       [Owlie]
// @description  Yuzu
// * Nippon Ichi Software
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0xe2748eb0 - 0x80004000]: mainHandler, // text1
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value;
    console.log('onEnter');

    /* processString */
    let s = address.readUtf32StringLE()
        .replaceAll('\n', ' ') // Single line
        ;
    return s;
}