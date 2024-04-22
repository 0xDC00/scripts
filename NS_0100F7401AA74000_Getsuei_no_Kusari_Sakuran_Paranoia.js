// ==UserScript==
// @name         [0100F7401AA74000] Getsuei no Kusari -Sakuran Paranoia-
// @version      1.0.0
// @author       GO123
// @description  Yuzu
// * TAKUYO
// *
// ==/UserScript==
const gameVer = '1.0.0';


globalThis.ARM = true;
const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

// I don't know if those scripts have been done before the tracer fix so if there's a problem multiply the register by 2 
// Old tracer assumed the register were 64bit which was wrong
setHook({
    '1.0.0': {
        [0x21801c - 0x204000]: mainHandler.bind_(null, 2, "text"),
        [0x228fac - 0x204000]: mainHandler.bind_(null, 1, "choices"),
        [0x267f24 - 0x204000]: mainHandler.bind_(null, 1, "dictionary"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const reg = regs[index];
    const address = reg.value;
    /* processString */
    const s = address.readShiftJisString()
        .replaceAll(/[\s]/g, '')
        .replaceAll(/@[a-z]/g, "")
        .replaceAll(/@[0-9]/g, "")
        ;

    return s;
}
