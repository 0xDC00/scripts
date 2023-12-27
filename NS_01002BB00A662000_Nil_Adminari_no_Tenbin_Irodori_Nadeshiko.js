// ==UserScript==
// @name         [01002BB00A662000] Nil Adminari no Tenbin Irodori Nadeshiko
// @version      1.0.0
// @author       Koukdw
// @description  
// * Otomate
// * Idea Factory (アイディアファクトリー)
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x8007C3E8 - 0x80004000]: mainHandler.bind_(null, 0, "name"), // name slow but in order (work on both games)
        [0x8007c23c - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"), // dialogue slow but in order (work on both games)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    // Filter garbage calls causing errors
    if (reg.vm < 0x8000000 || reg.vm > 0x9999999) return null;

    console.log('onEnter: ' + hookname);
    const address = reg.value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readShiftJisString();
    // print rubi
    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi: ' + rubi[3]);
        console.log('rube: ' + rubi[2]);
    }
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, '$2');

    s = s.replace(/(#n)+/g, ' ') // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, ''); // Remove controls
    // #Ruby[森恒犀鳥,もりつねさいちょう]
    // #n
    return s;
}