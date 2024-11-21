// ==UserScript==
// @name         [01007A901E728000] Hakkenden
// @version      1.0.1
// @author       [GO123]
// @description  Ryujinx
// * PROTOTYPE
// * 
//
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');


setHook({
    '1.0.1': {
        [0x819ade74 - 0x80004000]: mainHandler.bind_(null, 1, "text1"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len)

        .replace(/(\\n)+/g, '')
        .replace(/\S+＠/g, "")
        .replace(/\\/g, "")
        .replace(/(\@)+/g, '')

        ;

    return s;

}
