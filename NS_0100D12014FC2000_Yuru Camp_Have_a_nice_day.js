// ==UserScript==
// @name         [0100D12014FC2000] Yuru Camp△ - Have a Nice Day!
// @version      0.1 - 1.0.0
// @author       [Darkmans]
// @description  Yuzu
// * MAGES. GAME
// * Unity (il2cpp)
//
// https://vndb.org/v30937
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, "200+");

setHook({
    '1.0.0': {
        [0x816d03f8 - 0x80004000]: mainHandler, // dialog / backlog
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    console.log('onEnter');

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');

    return s;
}