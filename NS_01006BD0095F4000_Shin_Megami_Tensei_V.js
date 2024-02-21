// ==UserScript==
// @name         [01006BD0095F4000] Shin Megami Tensei V
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Atlus
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.2': {
        [0x80ce01a4 - 0x80004000]: mainHandler.bind_(null, 0, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    return s;
}