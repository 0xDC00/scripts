// ==UserScript==
// @name         [PCSG00667] Love:Quiz ~Koi Suru Otome no Final Answer~ 
// @version      1.00
// @author       kenzy
// @description  Vita3k
// * EMIQ Inc. & Asgard
// * 
// ==/UserScript==

const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200+'); 
   
setHook({
    0x8003acba: mainHandler.bind_(null, 0),  // text
    0x80016dd6: mainHandler.bind_(null, 1),  // choices
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value;
   // console.log("onEnter", hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    
    let s = address.readUtf16String();

return s;
}
