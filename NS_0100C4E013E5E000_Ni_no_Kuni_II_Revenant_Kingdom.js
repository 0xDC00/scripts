// ==UserScript==
// @name         [0100C4E013E5E000] Ni no Kuni II: Revenant Kingdom
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Level-5
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x80ac651c - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x80335ea0 - 0x80004000]: mainHandler.bind_(null, 0, "Name"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* This script is only for the main text, any other UI element will not be captured.
* Try using an OCR for those parts.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s.replace(/\\n/g, '\n'); // Replace \n with Line breaks

    return s;
}