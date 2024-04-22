// ==UserScript==
// @name         [010027100C79A000] Rune Factory 4 Special
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * XSEED Games, Marvelous
// *
// ==/UserScript==
const gameVer = '1.0.1';
globalThis.ARM = true;

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, 200);



setHook({
    '1.0.1': {
        [0x48b268 - 0x204000]: mainHandler, // All text
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs) {
// I don't know if those scripts have been done before the tracer fix so if there's a problem multiply the register by 2 
// Old tracer assumed the register were 64bit which was wrong
    const address = regs[3].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}