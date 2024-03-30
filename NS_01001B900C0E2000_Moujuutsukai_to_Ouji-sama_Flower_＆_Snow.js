// ==UserScript==
// @name         [01001B900C0E2000] Moujuutsukai to Ouji-sama ~Flower ＆ Snow~ 
// @version      1.0.0
// @author       [GO123]
// @description  Yuzu
// *Otomate
// *Design Factory Co., Ltd. & Idea Factory Co., Ltd.
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/[\s]/g, '')
        .replaceAll(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')
        .replaceAll(/#[a-z]/g, '')
        .replaceAll(/[a-z]/g, '')

        ;
});
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x800a1a10 - 0x80004000]: mainHandler.bind_(null, 1, "Dialogue1"), // Dialogue
        [0x80058f80 - 0x80004000]: mainHandler.bind_(null, 1, "Dialogue2"), // Dialogue
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter ' + hookname);

    const address = regs[index].value;

    /* processString */
    let s = address.readUtf8String();

    return s;
}
