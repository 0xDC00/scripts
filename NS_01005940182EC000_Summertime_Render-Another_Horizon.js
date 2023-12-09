// ==UserScript==
// @name         [01005940182EC000] サマータイムレンダ Another Horizon
// @version      0.1 - 1.0.0
// @author       [hitsulol]
// @description  Yuzu
// * MAGES. GAME
// * Unity (il2cpp)

// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, "200+");

setHook({
    '1.0.0': {
        [0x818ebaf0 - 0x80004000]: mainHandler, //dialogue
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {

    const address = regs[0].value;


    console.log('onEnter');

    /* processString */
    let s = address.add(0x14).readUtf16String();
    s = s.replace(/\s/g, '') //remove any whitespace
        .replace(/<color=.*>(.*)<\/color>/g, '$1'); //remove color tag
    return s;
}