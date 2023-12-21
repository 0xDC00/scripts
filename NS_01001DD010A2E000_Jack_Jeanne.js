// ==UserScript==
// @name         [01001DD010A2E800] JackJanne
// @version      1.0.5
// @author       [zooo]
// @description  Yuzu
// *
// ==/UserScript==
const gameVer = '1.0.5';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.5': {
        [0x81f02cd8 - 0x80004000]: mainHandler, // text
        [0x821db028 - 0x80004000]: mainHandler, // choice

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    console.log('onEnter');

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');

    return s;
}