// ==UserScript==
// @name         [0100B5700CDFC000] AMNESIA LATER×CROWD for Nintendo Switch 
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = '1.0.0';
// trans.replace(function(s) {
//     return s
//         .replace(/オリオン/g, 'Orion')
//         .replace(/トーマ/g, 'Toma')
//     ;
// });

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler.bind_(null, 1), '250+'); // join 250ms; x1

setHook({
    '1.0.0': {
        [0x800ebc34 - 0x80004000]: mainHandler, // waterfall
        [0x8014dc64 - 0x80004000]: mainHandler, // name
        [0x80149b10 - 0x80004000]: mainHandler, // dialogue
        [0x803add50 - 0x80004000]: mainHandler, // choice
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index) {
    const address = regs[index].value;
    console.log('onEnter');
    
    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');
    
    return s;
}