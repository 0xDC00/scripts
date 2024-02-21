// ==UserScript==
// @name         [0100CBA014014000] Tantei Bokumetsu / 探偵撲滅
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Nippon Ichi Software
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8011c340 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
        [0x80064f20 - 0x80004000]: mainHandler.bind_(null, 1, "Choices"),
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

    s = s
    .replace(/《.*?》/g, '') // Remove furigana ( 和都《2,わと》)
    .replace(/<[^>]*>/g, ''); // Remove HTML tags

    return s;
}