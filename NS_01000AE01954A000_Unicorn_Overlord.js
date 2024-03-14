// ==UserScript==
// @name         [01000AE01954A000] Unicorn Overlord
// @version      1.00
// @author       [Kalleo]
// @description  Yuzu
// * Atlus, Vanillaware
// *
// ==/UserScript==
const gameVer = '1.00';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.00': {
        [0x805ae1f8 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[~^(-).%,!:#@$/*&;+_]/g, ''); // Remove specified symbols

    return s;
}