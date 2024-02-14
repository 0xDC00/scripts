// ==UserScript==
// @name         [010024200E00A000] Uta no☆Prince-sama♪ Repeat Love / うたの☆プリンスさまっ♪Repeat LOVE
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * 株式会社ブロッコリー
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x800374a0 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text + Name"),
        [0x8002ea08 - 0x80004000]: mainHandler.bind_(null, 0, "Choices"),
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
    let s = address.readShiftJisString();

    s = s.replace(/%N/g, '\n'); // Replace %N with Line breaks

    return s;
}