// ==UserScript==
// @name         [0100874017BE2000] BUSTAFELLOWS season2
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Unity
// ==/UserScript==
const gameVer = '1.0.0';
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x819ed3e4 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
        [0x82159cd0 - 0x80004000]: mainHandler.bind_(null, 1, "textmessage"),
        [0x81e17530 - 0x80004000]: mainHandler.bind_(null, 0, "option"),
        [0x81e99d64 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
        [0x8186f81c - 0x80004000]: mainHandler.bind_(null, 0, "archives"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ' + hookname);
    const address = regs[index].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');
    s = s.replace(/#n/g, '');
    return s;
}