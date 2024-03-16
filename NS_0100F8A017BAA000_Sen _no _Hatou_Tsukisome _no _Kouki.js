// ==UserScript==
// @name         [0100F8A017BAA000] Sen no Hatou, Tsukisome no Kouki
// @version      1.0.0
// @author       GO123
// @description  Yuzu
// * AUGUST & ARIA & ENTERGRAM
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.0': {
        [0x8003fc90 - 0x80004000]: mainHandler.bind_(null, 1, 0), // text1
        [0x8017a740 - 0x80004000]: mainHandler.bind_(null, 0, 0), // text2

        // [0x8017a61c - 0x80004000]: mainHandler, //with no text at top

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset) {
    console.log('onEnter');

    const address = regs[index].value.add(offset);

    /* processString */
    let s = address.readUtf8String()

    return s;
}