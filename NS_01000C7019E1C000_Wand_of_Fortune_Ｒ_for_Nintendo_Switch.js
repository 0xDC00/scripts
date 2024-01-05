// ==UserScript==
// @name         [01000C7019E1C000] ワンド オブ フォーチュン Ｒ～ for Nintendo Switch
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Design Factory Co., Ltd. & Otomate
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replace(/<param==Name>/g, 'ルル') 
      ;
});
//------------------------------------------------
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const decoder = new TextDecoder('utf-16');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x81ed0580 - 0x80004000]: mainHandler, // dialogue
        [0x81f96bac - 0x80004000]: mainHandler, // name
        [0x8250ac28 - 0x80004000]: mainHandler, // choice


    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    console.log('onEnter');

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/[\s]/g,'');

    return s;
}
