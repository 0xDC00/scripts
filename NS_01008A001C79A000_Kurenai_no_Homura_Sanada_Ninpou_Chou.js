// ==UserScript==
// @name         [01008A001C79A000] Kurenai no Homura Sanada Ninpou Chou (真紅の焔 真田忍法帳)
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * Design Factory & Otomate
// * Idea Factory
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');
const subHandler = trans.send(handler, '200+'); 

setHook({
    '1.0.0': {
        [0x800170a0 - 0x80004000]: mainHandler.bind_(null, 0, "text"), 
       // [0x800220a0 - 0x80004000]: mainHandler.bind_(null, 2, "names"),
        [0x8004bbd0 - 0x80004000]: subHandler.bind_(null, 1, "choices"),
        [0x80062a20 - 0x80004000]: subHandler.bind_(null, 0, "dict popup"),
        [0x80064c48 - 0x80004000]: subHandler.bind_(null, 3, "dict menu")         
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
// console.log("onEnter: " + hookname);
// console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

let s = address.readUtf8String()
s = s.replace(/(#n)+/g, ' ') 
     .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '');
    
return s; 
}
