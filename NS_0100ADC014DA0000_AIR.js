// ==UserScript==
// @name         [0100ADC014DA0000] AIR
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Key
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x800a6b10 - 0x80004000]: mainHandler.bind_(null, 1, "Text + Name"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
The intro (White screen and black text) was not hooked, probably because it's an image or video.
Try using an OCR for that part.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s
    .replace(/[~^$(,)]/g, '') // Remove specified symbols
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/@/g, ' ') // Replace @ for spaces
    .replace(/^\s+/, ''); // Trim spaces if the sentence starts with one

    return s;
}