// ==UserScript==
// @name         Meiji Katsugeki Haikara Ryuuseigumi -Seibai Shimaseu, Yonaoshi Kagyou-
// @version      1.0.0
// @author       [nanaa]
// @description  Yuzu
// * Idea Factory Co., Ltd. & Otomate

// ==/UserScript==
const gameVer = '1.0.0';

globalThis.ARM = true;
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+');

setHook({
    '1.0.0': {
        //[0x2a6a64 - 0x204000]: mainHandler.bind_(null, 0, "dialogue1"), //dialogue 1.0.1 buggy, native
        [0x2ab2fc - 0x204000]: mainHandler.bind_(null, 6, "dialogue1"), //dialogue 1.0.0 pyramid
        //[0x243db4 - 0x204000]: mainHandler.bind_(null, 6, "t1"), //dialogue + name 1.0.0 buggy
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let pre = '';
function handler(regs, index, hookname) {
    /** @type NativePointer */
    const address = regs[index].value; // x3

    //console.log("onEnter" + hookname);

    let s = address.readUtf8String();
    
    if (pre.indexOf(s) !== -1) {
        return null; // skip duplicate (menu, color)
    }

    pre = s;
    s = s.replace(/[~^$(,)R]/g, ' '); //remove symbols
    s = s.replace(/\\n/g, ' '); // single line

    return s;
}