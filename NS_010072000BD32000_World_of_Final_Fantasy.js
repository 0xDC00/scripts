// ==UserScript==
// @name         [010072000BD32000] World of Final Fantasy Maxima
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8068fea0 - 0x80004000]: mainHandler.bind_(null, 0, "Cutscene"),
        [0x802c6a48 - 0x80004000]: mainHandler.bind_(null, 0, "Action Text"),
        [0x803a523c - 0x80004000]: mainHandler.bind_(null, 1, "Location"),
        [0x8041ed64 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x802c9f1c - 0x80004000]: mainHandler.bind_(null, 0, "Chapter First Part"),
        [0x802c9f6c - 0x80004000]: mainHandler.bind_(null, 0, "Chapter Second Part"),
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
    .replace(/\[~\]/g, '\n') // Replace [~] with Line breaks
    .replace(/rom:[\s\S]*$/, '') // Remove anything after rom:
    .replace(/\[[\w\d]*\[[\w\d]*\].*?\[\/[\w\d]*\]\]/g, '') // Remove furigana
    .replace(/\[.*?\]/g, '') // Remove anything inside []

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}