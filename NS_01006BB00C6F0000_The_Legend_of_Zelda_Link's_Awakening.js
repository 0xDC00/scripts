// ==UserScript==
// @name         [01006BB00C6F0000] The Legend of Zelda: Link's Awakening
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Nintendo
// * 
// * OBS: Furigana needs to be disabled
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x80f57910 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const address = regs[index].value;
    console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();
    
    return s;
}