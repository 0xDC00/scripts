// ==UserScript==
// @name         [01001EF017BE6000] Rune Factory 3 Special
// @version      1.0.4
// @author       [Kalleo]
// @description  Yuzu
// * XSEED Games, Marvelous
// *
// ==/UserScript==
const gameVer = '1.0.4';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.4': {
        [0x81fb3364 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x826c0f20 - 0x80004000]: mainHandler.bind_(null, 1, "Aproach"),
        [0x81fb3320 - 0x80004000]: mainHandler.bind_(null, 0, "Choices"),
        [0x821497e8 - 0x80004000]: mainHandler.bind_(null, 1, "Calendar"),
        [0x826ba1a0 - 0x80004000]: mainHandler.bind_(null, 1, "Info"),
        [0x823f6200 - 0x80004000]: mainHandler.bind_(null, 0, "More Info"),
        [0x826c381c - 0x80004000]: mainHandler.bind_(null, 1, "Item Select Name"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s.replace(/^\s*$/gm, ''); // Remove empty lines

    return s;
}