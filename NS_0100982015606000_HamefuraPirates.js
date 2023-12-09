// ==UserScript==
// @name         [0100982015606000] Hamefura Pirates
// @version      1.0.0
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
        [0x81e75940 - 0x80004000]: mainHandler, // Hamekai.TalkPresenter$$AddMessageBacklog
        [0x81c9ae60 - 0x80004000]: mainHandler, // Hamekai.ChoicesText$$SetText
        [0x81eb7dc0 - 0x80004000]: mainHandler, // Hamekai.ShortStoryTextView$$AddText
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value;
    console.log('onEnter');

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');

    return s;
}