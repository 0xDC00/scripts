// ==UserScript==
// @name         [010070D01A192000] Ys Memoire: The Oath in Felghana
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu/Ryujinx
// * Nihon Falcom
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, -200);

setHook({
    '1.0.1': {
        [0x80136af0 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readShiftJisString();

    s = s
    .replace(/<ruby[^>]*>.*?<endruby>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\\p.*/g, '')
    .replace(/\\n/g, '\n');

    return s;
}