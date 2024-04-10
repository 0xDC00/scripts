// ==UserScript==
// @name         [0100CB700D438000] Monster Hunter Stories 2: Wings of Ruin
// @version      1.5.2
// @author       [Kalleo]
// @description  Yuzu
// * CAPCOM
// *
// ==/UserScript==
const gameVer = '1.5.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.5.2': {
        [0x8042fe60 - 0x80004000]: mainHandler.bind_(null, 1, "Cutscene"),
        [0x804326c0 - 0x80004000]: mainHandler.bind_(null, 1, "Ptc Text"),
        [0x804d3d44 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x8045e7c8 - 0x80004000]: mainHandler.bind_(null, 0, "Info Choice"),
        [0x805cec4c - 0x80004000]: mainHandler.bind_(null, 0, "Config Header"),
        [0x8078c2d0 - 0x80004000]: mainHandler.bind_(null, 0, "Config Name+"),
        [0x805d0858 - 0x80004000]: mainHandler.bind_(null, 0, "Config Description"),
        [0x807612d4 - 0x80004000]: mainHandler.bind_(null, 0, "Notice"),
        [0x807194a0 - 0x80004000]: mainHandler.bind_(null, 1, "Update Content + Tutorial"),
        [0x804d687c - 0x80004000]: mainHandler.bind_(null, 0, "Objective Title"),
        [0x804d6a7c - 0x80004000]: mainHandler.bind_(null, 0, "Objective Description"),
        [0x80509900 - 0x80004000]: mainHandler.bind_(null, 0, "Aproach Text"),
        [0x8060ee90 - 0x80004000]: mainHandler.bind_(null, 1, "Acquired Item"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/<RUBY><RB>(.*?)<\/RB><RT>(.*?)<\/RT><\/RUBY>/g, '$1') // Remove Furigana
    .replace(/<[^>]*>/g, '') // Remove HTML tags

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}