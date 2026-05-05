// ==UserScript==
// @name         [010071F027510000] Nandome ka no Shiki (何度目かの式)
// @version      1.0.0
// @author       [GO123]
// * orange inc.
// * Unity
// ==/UserScript==
const gameVer = '1.0.0';
trans.replace(function (s) {
    return s
        .replaceAll(/[\r\n]+/g, ' ')
        ;
});

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x818ed15c - 0x80004000]: mainHandler.bind_(null, 0, "text")


    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);


    return s;
}
