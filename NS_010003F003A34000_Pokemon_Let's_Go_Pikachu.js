// ==UserScript==
// @name         [010003F003A34000] Pokémon Let’s Go, Pikachu!
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Nintendo
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, -200);

setHook({
    '1.0.2': {
        [0x8067d9fc - 0x80004000]: mainHandler.bind_(null, 0, "Text"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s
    .replace(/[\s\S]*$/, '') // Remove anything after 
    .replace(/\n+/g, ' ') // Remove line breaks
    .replace(/\s/g, '') // Remove spaces
    .replace(/[＀븅]/g, '') // Remove specified characters
    
    return s;
}