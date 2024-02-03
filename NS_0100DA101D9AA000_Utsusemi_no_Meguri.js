// ==UserScript==
// @name         [0100DA101D9AA000] Utsusemi no Meguri
// @version      1.0.0
// @author       GO123
// @description  Yuzu
// * Matatabi
// * Unity
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll("\n", '')

        ;
});
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x821b452c - 0x80004000]: mainHandler.bind_(null, 0, 0), // text1
        [0x821b456c - 0x80004000]: mainHandler.bind_(null, 0, 0), // text2
        [0x821b45ac - 0x80004000]: mainHandler.bind_(null, 0, 0), // text3
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset) {
    console.log('onEnter');
    const address = regs[index].value.add(offset); // x0
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    return s;
}


