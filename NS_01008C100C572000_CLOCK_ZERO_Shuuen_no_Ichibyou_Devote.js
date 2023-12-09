// ==UserScript==
// @name         [01008C100C572000] CLOCK ZERO ~Shuuen no Ichibyou~ Devote
// @version      1.0.0
// @author       Koukdw
// @description  Yuzu
// * Otomate
// * Idea Factory (アイディアファクトリー)
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x8003c290 - 0x80004000]: mainHandler.bind_(null, 0, "name"), // slow but in order
        [0x8003c184 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"), // slow but in order
        [0x8001f6d0 - 0x80004000]: mainHandler.bind_(null, 0, "prompt"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ' + hookname);

    const address = regs[index].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    /** @type {string} */
    let s = address.readShiftJisString();
    // print rubi
    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi', rubi[3]);
        console.log('rube', rubi[2]);
    }
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, '$2');

    s = s.replace(/(#n)+/g, ' ') // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, ''); // Remove controls
    // #Ruby[森恒犀鳥,もりつねさいちょう]
    // #n
    return s;
}

