// ==UserScript==
// @name         [0100B5700CDFC000] AMNESIA LATER×CROWD for Nintendo Switch 
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * il2cpp
// ==/UserScript==
const gameVer = '1.0.0';
// trans.replace(function(s) {
//     return s
//         .replace(/オリオン/g, 'Orion')
//         .replace(/トーマ/g, 'Toma')
//     ;
// });

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler.bind_(null, 1), '250+'); // x1

setHook({
    '1.0.0': {
        0x80ebc34: mainHandler, // waterfall
        0x814dc64: mainHandler, // name
        0x8149b10: mainHandler, // dialogue
        0x83add50: mainHandler, // choice
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index) {
    const address = regs[index].value;
    console.log('onEnter');
    
    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ')
    
    return s;
}