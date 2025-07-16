// ==UserScript==
// @name         [010087201EEA6000] Side Kicks! beyond 
// @author       GO123
// @description  Sudachi
// * Extend
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.2': {
        [0x81a1738c - 0x80004000]: mainHandler.bind_(null, 1, "Dialogue"),

    }

}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf16String();
    s = s.replace(/\n+|(\\n)+/g, ' ');
    s = s.replace(/{[^}]*}/g, "");

    return s;
}







