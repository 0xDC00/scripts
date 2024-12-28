// ==UserScript==
// @name         [PCSG00420] DRAMAtical Murder re:code
// @version      1.00
// @author       kenzy
// @description  Vita3K
// * Nitro+CHiRAL
// * 
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200+');

setHook({  
   0x8004630a: mainHandler.bind_(null, 0),   // text
   0x8003eed2: mainHandler.bind_(null, 0),   // choices 
 });

function handler(regs, index, hookname) {
  const address = regs[index].value;
  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString()
  s = s.replace(/\^/g, "");


  return s;
}
