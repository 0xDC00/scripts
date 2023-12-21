// ==UserScript==
// @name         [010061A01C1CE000] DesperaDrops
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * Unity
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8199c95c - 0x80004000]: mainHandler, // text1
        [0x81d5c900 - 0x80004000]: mainHandler, // text2
        [0x820d6324 - 0x80004000]: mainHandler, // cc

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value;
    console.log('onEnter');

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');
    s = s.replace(/sound/g, ' ');

    return s;
}