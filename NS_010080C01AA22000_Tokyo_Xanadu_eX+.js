// ==UserScript==
// @name         [010080C01AA22000] Tokyo Xanadu eX+
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Nihon Falcom
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8025135c - 0x80004000]: mainHandler.bind_(null, 1, "Name"),
        [0x80251068 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x802ac86c - 0x80004000]: mainHandler.bind_(null, 0, "Action Text"),
        [0x802b04b4 - 0x80004000]: mainHandler.bind_(null, 0, "Choices"),
        [0x8013243c - 0x80004000]: mainHandler.bind_(null, 0, "Location"),
        [0x802b1f3c - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x802ab46c - 0x80004000]: mainHandler.bind_(null, 0, "Documents"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/#\d+R.*?#/g, '') // Remove furigana
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[().%,_!#©&:?/]/g, '') // Remove specified symbols

    return s;
}