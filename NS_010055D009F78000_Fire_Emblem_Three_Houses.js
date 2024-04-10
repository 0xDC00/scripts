// ==UserScript==
// @name         [010055D009F78000] Fire Emblem: Three Houses
// @version      1.2.0
// @author       [Kalleo]
// @description  Yuzu
// * Intelligent Systems, Koei Tecmo Games
// *
// ==/UserScript==
const gameVer = '1.2.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);

setHook({
    '1.2.0': {
        [0x8041e6bc - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x805ca570 - 0x80004000]: mainHandler.bind_(null, 0, "Cutscene Text"),
        [0x8049f1e8 - 0x80004000]: mainHandler.bind_(null, 0, "Cutscene Text Scroll"),
        [0x805ee730 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x805ee810 - 0x80004000]: mainHandler.bind_(null, 0, "Info Choice"),
        [0x80467a60 - 0x80004000]: mainHandler.bind_(null, 0, "Location First Part"),
        [0x805f0340 - 0x80004000]: mainHandler.bind_(null, 0, "Location Second Part"),
        [0x801faae4 - 0x80004000]: mainHandler.bind_(null, 0, "Action Location"),
        [0x803375e8 - 0x80004000]: mainHandler.bind_(null, 0, "Objective"),
        [0x805fd870 - 0x80004000]: mainHandler2.bind_(null, 0, "Tutorial"),
        [0x804022f8 - 0x80004000]: mainHandler2.bind_(null, 0, "Request"),
        [0x802f7df4 - 0x80004000]: mainHandler2.bind_(null, 0, "Quest Description"),
        [0x8031af0c - 0x80004000]: mainHandler2.bind_(null, 0, "Aproach Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* Some observations:

* The text for cutscenes will appear after it goes off the screen.

* Your character's name will not be captured by the script.

* You will notice that when the tutorial has multiple pages, only the first one will be captured. However, you can pause and unpause the emulator to make the text for the next page appear.

* Some elements such as choices, menu, item names and etc.. could not be captured. Consider using an OCR for those parts if you need it.
`);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s.replace(/\d+/g, ''); // Remove numbers

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}