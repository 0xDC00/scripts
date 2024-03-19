// ==UserScript==
// @name         [0100FDB00AA80000] Layton’s Mystery Journey: Katrielle and the Millionaires’ Conspiracy
// @version      1.1.0
// @author       [Kalleo]
// @description  Yuzu
// * LEVEL-5
// *
// ==/UserScript==
const gameVer = '1.1.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.1.0': {
        [0x8025d520 - 0x80004000]: mainHandler.bind_(null, 2, "All Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readShiftJisString();

    s = s
    .replace(/\[([^\]]+)\/[^\]]+\]/g, '$1') // Remove furigana ex: [腕/うで]
    .replace(/<[^>]*>/g, ''); // Remove HTML tags

    return s;
}