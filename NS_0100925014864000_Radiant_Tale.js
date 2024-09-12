// ==UserScript==
// @name         [0100925014864000] Radiant Tale
// @version      1.0.0
// @author       Koukdw
// @description  
// * Design Factory & Otomate
// * Idea Factory (アイディアファクトリー)
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x80075190 - 0x80004000]: mainHandler.bind_(null, 1, "prompt"),
        [0x8002fb18 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
        [0x8002fd7c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
        [0x8004cf28 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String()
        .replace(/(#n)+/g, ' ') // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '') // Remove controls
        ;
    return s;
}
