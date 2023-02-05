// ==UserScript==
// @name         [0100A460141B8000] Shiro to Kuro no Alice
// @version      1.0.0 (base)
// @author       Koukdw
// @description  
// * Kogado Girls Project
// * Idea Factory (アイディアファクトリー) & Otomate
// * AliceNX_MPA (string inside binary)
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        // Shiro to Kuro no Alice
        0x8013f20: mainHandler.bind_(null, 0, "name"),
        0x8013f94: mainHandler.bind_(null, 0, "dialogue"),
        0x801419c: mainHandler.bind_(null, 0, "choice"),
        // Shiro to Kuro no Alice -Twilight line-
        0x8014260: mainHandler.bind_(null, 0, "name"),
        0x80142d4: mainHandler.bind_(null, 0, "dialogue"),
        0x80144dc: mainHandler.bind_(null, 0, "choice"),
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;

    console.log('onEnter: ' + hookname);
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String()
        .replace('\n', ' ') // Single line
    ;
    
    return s;
}