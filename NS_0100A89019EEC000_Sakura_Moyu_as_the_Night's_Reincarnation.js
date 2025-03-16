// ==UserScript==
// @name         [0100A89019EEC000] Sakura, Moyu. -as the Night's, Reincarnation-
// @version      1.0.0
// @author       [GO123]
// @description yuzu  & ryujinx
// * Unity
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/\s/g, '')

        ;
});
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200++'); // join 200ms

setHook({
    '1.0.0': {
        [0x82340e88 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
       
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ' + hookname);
    const address = regs[index].value;
console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
    return s;
}
