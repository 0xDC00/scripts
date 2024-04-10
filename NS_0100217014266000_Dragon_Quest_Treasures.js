// ==UserScript==
// @name         [0100217014266000] Dragon Quest Treasures
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x80bd62c4 - 0x80004000]: mainHandler.bind_(null, 0, "Cutscene"),
        [0x80a74b64 - 0x80004000]: mainHandler.bind_(null, 0, "Ptc Text"),
        [0x80a36d18 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x80c43878 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Title"),
        [0x80c43d50 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description"),
        [0x80a72598 - 0x80004000]: mainHandler.bind_(null, 0, "Aproach Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/｛([^｛｝]+)：[^｛｝]+｝/g, '$1') // Remove furigana formatting ｛年：ねん｝ to just 年
    .replace(/^\s+/gm, '') // Trim lines that starts with spaces

    return s;
}