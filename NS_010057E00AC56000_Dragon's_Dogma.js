// ==UserScript==
// @name         [010057E00AC56000] Dragon's Dogma: Dark Arisen
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Capcom
//*
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);

setHook({
    '1.0.1': {
        [0x81023a80 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
        [0x8103e140 - 0x80004000]: mainHandler.bind_(null, 1, "Allies + Cutscene Text"),
        [0x8103bb10 - 0x80004000]: mainHandler.bind_(null, 1, "NPC Text"),
        [0x80150720 - 0x80004000]: mainHandler.bind_(null, 0, "Intro Message"),
        [0x80df90a8 - 0x80004000]: mainHandler.bind_(null, 0, "Info1"),
        [0x80ce2bb8 - 0x80004000]: mainHandler.bind_(null, 0, "Info2"),
        [0x80292d84 - 0x80004000]: mainHandler.bind_(null, 0, "Info Popup1"),
        [0x80cfac6c - 0x80004000]: mainHandler.bind_(null, 0, "Info Popup2"),
        [0x8102d460 - 0x80004000]: mainHandler2.bind_(null, 1, "Description"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

 
let previous = "";
function handler(regs, index, hookname) {
    // console.log('onEnter: ' + hookname);

    const address = regs[index].value;
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/ズーム|回転|身長|体重/g, '') // Remove specific words
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[().%,!#/]/g, '') // Remove specified symbols
    .replace(/^\s*$/gm, ''); // Remove empty lines

    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}