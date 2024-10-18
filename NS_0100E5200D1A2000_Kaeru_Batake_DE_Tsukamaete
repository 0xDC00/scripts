// ==UserScript==
// @name         [0100E5200D1A2000] Kaeru Batake DE Tsukamaete☆ (カエル畑DEつかまえて☆彡)
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * TAKUYO
// ==/UserScript==
const gameVer = '1.0.0';

globalThis.ARM = true;
const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x2206bc - 0x204000]: mainHandler.bind_(null, 0, "text"),    // dialogue + names
        [0x220cfc - 0x204000]: mainHandler.bind_(null, 0, "choices"),
        [0x2372b0 - 0x204000]: mainHandler.bind_(null, 1, "game"),    // eco question   
 }   
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    const address = reg.value;

    /* processString */
    let s = address.readShiftJisString();
    s = s
        .replace(/(\\n)+/g, ' ')  
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
        .replace(/\u3000+/gu, '')
        
        if (hookname === "choices") {
        s = s.replace(/, ?\w+/g, '');
    }

    return s;
}
