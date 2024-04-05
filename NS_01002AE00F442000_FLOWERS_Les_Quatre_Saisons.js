// ==UserScript==
// @name         [01002AE00F442000] Flowers: Les Quatre Saisons 
// @version      1.0.1
// @author       [Owlie]
// @description  Yuzu
// *   Innocent Grey
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x8006f940 - 0x80004000]: mainHandler, // text　
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value;
    //console.log('onEnter');

    /* processString */
    let s = address.readUtf16String();

    // Remove furigana enclosed within square brackets
    s = s.replace(/\[([^\]\/]+)\/[^\]]+\]/g, '$1');

    // Remove @ symbol
    s = s.replace(/(\S*)@/g, '$1');

    // Remove remaining $ symbols
    s = s.replace(/\$/g, '');

    return s;
}







