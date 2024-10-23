// ==UserScript==
// @name         [01007FD00DB20000] Katakoi Contrast -collection of branch- (片恋いコントラスト ―collection of branch―)
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * Otomate
// * Frontier Works Inc. & Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '250+'); 

setHook({
    '1.0.0': {
// Vol.1 //
        [0x8004ba20 - 0x80004000]: mainHandler.bind_(null, 0, ), // text
        [0x800c6eb0 - 0x80004000]: mainHandler.bind_(null, 1, ), // choices
// Vol.2 //
        [0x8017e560 - 0x80004000]: mainHandler.bind_(null, 0, ), // text
        [0x801f67c0 - 0x80004000]: mainHandler.bind_(null, 1, ), // choices
// Vol.3 //
        [0x802a76c0 - 0x80004000]: mainHandler.bind_(null, 0, ), // text
        [0x8031fc80 - 0x80004000]: mainHandler.bind_(null, 1, ), // choices
    }
    
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    //console.log('onEnter');
    const address = regs[1].value; 
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x60 }));

    // string processing
    let s = address.readUtf32StringLE();
        s = s.replace(/\n+/g, ' ');
        s = s.replace(/\#T1[^#]+/g, ''); 
        s = s.replace(/\#T\d/g, ''); 
        
    if(s === "　　") return null;    

return s;
}
