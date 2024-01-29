// ==UserScript==
// @name         [0100F4401940A000] Master Detective Archives: Rain Code
 
// @version      1.3.3
// @author       [Owlie] (Special thanks to Koukdw)
// @description  Yuzu
// * Spike Chunsoft, Too Kyo Games
//*
// ==/UserScript==
const gameVer = '1.3.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const descriptionHandler = trans.send(handler2, '200+');

setHook({
    '1.3.3': {
        [0x80bf2034 - 0x80004000]: mainHandler.bind_(null, 0, "Dialogue text"),
        [0x80c099d4 - 0x80004000]: mainHandler.bind_(null, 0, "Cutscene text"),
        [0x80cbf1f4 - 0x80004000]: mainHandler.bind_(null, 0, "Menu"),
        [0x80cbc11c - 0x80004000]: descriptionHandler.bind_(null, 0, "Menu Item Description"),
        [0x80cacc14 - 0x80004000]: descriptionHandler.bind_(null, 0, "Menu Item Description 2"),
        [0x80cd6410 - 0x80004000]: descriptionHandler.bind_(null, 0, "Menu Item Description 3"),
        [0x80c214d4 - 0x80004000]: mainHandler.bind_(null, 0, "Description"),
        [0x80cc9908 - 0x80004000]: descriptionHandler.bind_(null, 0, "Mini game item description"),
        [0x80bce36c - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial"),
        [0x80bcb7d4 - 0x80004000]: mainHandler.bind_(null, 0, "Loading Screen information"),
        [0x80bf32d8 - 0x80004000]: mainHandler.bind_(null, 0, "Choices"),

    } 
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    console.log('onEnter: ' + hookname);
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf16String();
    s = s.replace(/[\r\n]+/g, '').replace(/<[^>]+>|[[^]]+]/g, '');
    return s;
}

function handler2(regs, index, hookname) {
    const address = regs[index].value;
    console.log('onEnter: ' + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();
    return s
}