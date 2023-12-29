// ==UserScript==
// @name         [010050000705E000] Dragon Quest Builders 2
// @version      1.7.3
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix, Koei Tecmo Games, Omega Force
// *
// ==/UserScript==
const gameVer = '1.7.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.7.3': {

        // Main text
        [0x805f8900 - 0x80004000]: mainHandler.bind_(null, 1, "Main text textbox"),
        [0x8068a698 - 0x80004000]: mainHandler.bind_(null, 0, "Not press to continue text"),
        [0x806e4118 - 0x80004000]: mainHandler.bind_(null, 3, "Character creation text"),

        // Objectives
        [0x8067459c - 0x80004000]: mainHandler.bind_(null, 1, "Objective progress1"),
        [0x800a4f90 - 0x80004000]: mainHandler.bind_(null, 0, "Objective progress2"),

        // Miscellaneous texts
        [0x8060a1c0 - 0x80004000]: mainHandler.bind_(null, 0, "Infos1"),
        [0x805f6130 - 0x80004000]: mainHandler.bind_(null, 1, "Infos2"),

        // Items description
        [0x80639b6c - 0x80004000]: mainHandler.bind_(null, 2, "Item description"),

        // Mission
        [0x807185ac - 0x80004000]: mainHandler.bind_(null, 1, "Mission1"),
        [0x80657e4c - 0x80004000]: mainHandler.bind_(null, 1, "Mission2"),
        [0x80713be0 - 0x80004000]: mainHandler.bind_(null, 1, "Mission3"),

        // Tutorial
        [0x8076ab04 - 0x80004000]: mainHandler.bind_(null, 1, "Tutorial header"),
        [0x8076ab2c - 0x80004000]: mainHandler.bind_(null, 1, "Tutorial explanation"),

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    // THE ORDER IS IMPORTANT: Remove spaces -> Replace <br> with line breaks -> Remove furigana (ex: <日本語:にほんご>) -> Remove anything inside < >
    s = s
    .replace(/\s/g, '')
    .replace(/<br>/g, '\n')
    .replace(/<([^:>]+):[^>]+>/g, '$1')
    .replace(/<[^>]+>/g, '');

    return s;
}