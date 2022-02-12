// ==UserScript==
// @name         [0100982015606000] Hamefura Pirates
// @version      0.1 - 1.0.0
// @author       [SciresM]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * Unity (il2cpp)
//
// https://vndb.org/v29251
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        0x9E75940: mainHandler, // Hamekai.TalkPresenter$$AddMessageBacklog
        0x9C9AE60: mainHandler, // Hamekai.ChoicesText$$SetText
        0x9EB7DC0: mainHandler, // Hamekai.ShortStoryTextView$$AddText
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value;
    console.log('onEnter');

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');

    return s;
}