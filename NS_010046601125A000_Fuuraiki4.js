// ==UserScript==
// @name         [010046601125A000] Fuuraiki 4
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Nippon Ichi Software / FOG
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x80008c80 - 0x80004000]: mainHandler.bind_(null, 1, "main text"), // Main
        [0x80012b1c - 0x80004000]: mainHandler.bind_(null, 1, "main wordpad"), // Wordpad
        [0x80012ccc - 0x80004000]: mainHandler.bind_(null, 1, "internet comments"), // Comments
        [0x80009f74 - 0x80004000]: mainHandler.bind_(null, 1, "player choices"), // Choices
        [0x80023d64 - 0x80004000]: mainHandler.bind_(null, 0, "road location") // Location
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    //console.log(address.readUtf32StringLE())
    let s = address.readUtf32StringLE();
    s = s.replace(/<rb>(.+)<\/rb><rt>(.+)<\/rt>/g, "$1");
    s = s.replace(/\n+/g, ' ');

    return s;
}