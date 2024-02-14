// ==UserScript==
// @name         [0100771013FA8000] Ken ga Kimi for S / 剣が君 for S
// @version      1.1
// @author       [Kalleo]
// @description  Yuzu
// * Rejet
// *
// ==/UserScript==
const gameVer = '1.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.1': {
        [0x81477128 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x81470e38 - 0x80004000]: mainHandler.bind_(null, 1, "Secondary Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/<br>/g, '\n') // Replace <br> with line breaks
    .replace(/^\s+/, ''); // Trim spaces if the sentence starts with one

    return s;
}