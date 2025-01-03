// ==UserScript==
// @name         [PCSG01046] Usotsuki Shangri-La (嘘月シャングリラ)
// @version      1.0
// @author       kenzy
// @description  Vita3k
// * Rejet
// * 
// ==/UserScript==

const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200+'); 

console.log("In NVL section, the text will be displayed block by block rather than line by line.")
   
setHook({
    0x81e1f5c8: mainHandler.bind_(null, 0, 0, 'text'),  
    0x81e4a514: mainHandler.bind_(null, 0, 0, 'choices'), 
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);
   // console.log("onEnter", hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x80 }));

    const len = address.add(0x8).readU32() * 2;
    let s = address.add(0xC).readUtf16String(len);
    s = s.replace(/<br>/g, '');

    return s;
}
