// ==UserScript==
// @name         [01000C7019E1C000] Wand of Fortune R for Nintendo Switch (ワンド オブ フォーチュン R for Nintendo Switch)
// @version      1.0.0
// @author       [zooo], Mansive
// @description  Yuzu
// * Design Factory Co., Ltd. & Otomate
// ==/UserScript==

// trans.replace(function (s) {
    // return s
        // .replace(/<param==Name>/g, 'ルル');
// });
//------------------------------------------------
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        // [0x81ed0580 - 0x80004000]: mainHandler
        [0x81f96bfc - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
        [0x81f96bac - 0x80004000]: mainHandler.bind_(null, 0, "name"),
        [0x8250ac28 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    console.log("onEnter:", hookname);

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/[\s]/g,'');

    return s;
}
