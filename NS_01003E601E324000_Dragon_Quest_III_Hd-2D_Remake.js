// ==UserScript==
// @name         [01003E601E324000] Dragon Quest III Hd-2D Remake
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu/Ryujinx
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x80c4b094 - 0x80004000]: mainHandler.bind_(null, 0, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML Tags
    .replace(/\[[^\]]*\]/g, '');  // Remove furigana []
    return s;
}