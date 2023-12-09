// ==UserScript==
// @name         [0100A460141B8000] Shiro to Kuro no Alice
// @version      1.0.0
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
        [0x80013f20 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
        [0x80013f94 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
        [0x8001419c - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
        // Shiro to Kuro no Alice -Twilight line-
        [0x80014260 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
        [0x800142d4 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
        [0x800144dc - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;

    console.log('onEnter: ' + hookname);
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String()
        .replace('\n', ' ') // Single line
        ;

    return s;
}