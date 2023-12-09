// ==UserScript==
// @name         [0100BDD01AAE4000] 9 R.I.P
// @version      1.0.0 (base)
// @author       Koukdw
// @description  
// * Design Factory & Otomate
// * Idea Factory (アイディアファクトリー)
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200++'); // join all sentence, don't add new lines characters
const mainHandler2 = trans.send(handler, '200+'); // join all sentence, add new lines
const choiceHandler = trans.send(handler, 200); // if the game call this function many time we just copy the last one

setHook({
    '1.0.0': {
        [0x80025360 - 0x80004000]: mainHandler2.bind_(null, 2, "name"),
        [0x8003650c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
        [0x80034210 - 0x80004000]: choiceHandler.bind_(null, 1, "choice"),
        [0x80065010 - 0x80004000]: mainHandler2.bind_(null, 0, "character description"),
        [0x8009c8f0 - 0x80004000]: mainHandler2.bind_(null, 1, "prompt"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    //console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String()

    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi', rubi[3]);
        console.log('rube', rubi[2]);
    }
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, '$2')
        .replace(/(#n)+/g, ' ') // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, ''); // Remove controls
    return s;
}