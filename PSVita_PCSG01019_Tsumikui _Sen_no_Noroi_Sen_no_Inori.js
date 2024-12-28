// ==UserScript==
// @name         [PCSG01019] Tsumikui ~Sen no Noroi, Sen no Inori~ for V
// @version      1.0
// @author       kenzy
// @description  Vita3k
// * Operetta
// * Dramatic Create
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200+');

setHook({
    0x80080cd0: mainHandler.bind_(null, 0),  // text
   // 0x80080d4a: mainHandler.bind_(null, 0),  // names
    0x8001c73e: mainHandler.bind_(null, 1),  // choices
});

function handler(regs, index, hookname) {
    const address = regs[index].value;  
    // console.log("onEnter: ", hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString();
   
return s;
}
  
