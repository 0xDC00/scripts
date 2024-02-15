// ==UserScript==
// @name         [PCSG01282] 死神と少女 Shinigami to Shoujo
// @version      0.1
// @author       GO123
// @description  Vita3k
// *TAKUYO
// ==/UserScript==

//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
   
  0x800204ba: mainHandler.bind_(null, 2, 0, "dialogueNVL"),
  0x8000f00e: mainHandler.bind_(null, 1, 0, "dialogue main"),
  0x80011f1a: mainHandler.bind_(null, 0, 0, "Name"),
  0x8001ebac: mainHandler.bind_(null, 1, 0, "choices"),
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

   // console.log("onEnter: " + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString()
      .replaceAll(/[\s]/g,'')
      .replaceAll(/\\n/g,'')
      .replaceAll(/\\d/g,'')
      .replace(/@[a-z]/g, "")
	 ; 

    return s;
}