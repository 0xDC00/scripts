// ==UserScript==
// @name         [010039B015CB6000] Eiyuden Chronicle: Rising
// @version      1.02
// @author       [Kalleo]
// @description  Yuzu
// * 505 Games
// *
// ==/UserScript==
const gameVer = '1.02';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.02': {
        [0x82480190 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
        [0x824805d0 - 0x80004000]: mainHandler.bind_(null, 1, "Name"),
        [0x81f05c44 - 0x80004000]: mainHandler.bind_(null, 0, "Intro Text"),
        [0x82522ac4 - 0x80004000]: mainHandler.bind_(null, 0, "Character Info"),
        [0x81b715f4 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x825274d0 - 0x80004000]: mainHandler.bind_(null, 1, "Info2"),
        [0x825269b0 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Title"),
        [0x82526a0c - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description"),
        [0x82523e04 - 0x80004000]: mainHandler.bind_(null, 0, "Objective Title"),
        [0x82524160 - 0x80004000]: mainHandler.bind_(null, 0, "Objective Description"),
        [0x81f0351c - 0x80004000]: mainHandler.bind_(null, 0, "Location Selection Title"),
        [0x81f0358c - 0x80004000]: mainHandler.bind_(null, 0, "Location Selection Description"),
        [0x81f0d520 - 0x80004000]: mainHandler.bind_(null, 0, "Quest Title"),
        [0x81f0d58c - 0x80004000]: mainHandler.bind_(null, 0, "Quest Description"),
        [0x81f00318 - 0x80004000]: mainHandler.bind_(null, 0, "Help Title"),
        [0x81f00368 - 0x80004000]: mainHandler.bind_(null, 0, "Help Description"),
        [0x81f0866c - 0x80004000]: mainHandler.bind_(null, 0, "Config Description"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    return s;
}