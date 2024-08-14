// ==UserScript==
// @name         [01007AD01CB42000] Mistonia no Kibou - The Lost Delight
// @version      1.0.0
// @author       [nanaa]
// @description  Yuzu
// * Idea Factory Co., Ltd. & Otomate

// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.0': {
        [0x8246c4ac - 0x80004000]: mainHandler, // text
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    //console.log('onEnter');

    /* processString */
    let s = address.readUtf16String() 
    
    return s;
}