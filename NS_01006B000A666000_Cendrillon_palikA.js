// ==UserScript==
// @name         [01006B000A666000] Cendrillon palikA
// @version      1.0.0
// @author       Koukdw
// @description  
// * Otomate
// * Idea Factory (アイディアファクトリー)
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler0 = trans.send(handler);
const mainHandler1 = trans.send(handler, 200);

setHook({
    '1.0.0': {
        [0x8001ab8c - 0x80004000]: mainHandler0.bind_(null, 2, "name"),
        [0x80027b30 - 0x80004000]: mainHandler1.bind_(null, 0, "dialogue"), // only copy the last invocation on this hook. (example: 3 line -> string get appended 3 times)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ', hookname);

    const address = regs[index].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf8String()
        .replace(/(#n)+/g, ' ')
        ;
    return s;
}