// ==UserScript==
// @name         [010076902126E000] DYNAMIC CHORD feat.[rēve parfait]
// @version      1.0.0
// @author       GO123
// @description  sudachi
// * Honeybee Black & arithmetic & Dramatic Create
// ==/UserScript==  
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
   [0x81a48614 - 0x80004000]: mainHandler.bind_(null, 1, "text"),
   [0x81a5d890 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
  
    
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;
// console.log("onEnter: " + hookname);
//console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String().replace(/<br>/g, "")
   

  return s;
}
