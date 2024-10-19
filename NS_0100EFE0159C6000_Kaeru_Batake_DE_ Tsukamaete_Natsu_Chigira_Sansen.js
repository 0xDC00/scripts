// ==UserScript==
// @name         [0100EFE0159C6000] Kaeru Batake DE Tsukamaete: Natsu Chigira Sansen! (カエル畑DEつかまえて・夏 千木良参戦!)
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
        [0x2210d0 - 0x204000]: mainHandler.bind_(null, 0, "text"),    // dialogue + names
        [0x221768 - 0x204000]: mainHandler.bind_(null, 0, "choices"),
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
        .replace(/@w|\\c/g, '');
        
    if (hookname === "choices") {
    s = s.replace(/, ?\w+/g, '');
    }

    return s;
}
