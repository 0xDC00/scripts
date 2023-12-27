// ==UserScript==
// @name         [01000E200DC58000] Octopath Traveler
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8005ef78 - 0x80004000]: mainHandler.bind_(null, 0, "main text"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf32StringLE();
    
    return s;
}