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
const mainHandler1 = trans.send(handler, "200++");
setHook({

  0x800204ba: mainHandler.bind_(null, 2, 0, "dialogueNVL"),
  0x8000f00e: mainHandler1.bind_(null, 1, 0, "dialogue main"),
  0x80011f1a: mainHandler1.bind_(null, 0, 0, "Name"),
  0x8001ebac: mainHandler.bind_(null, 1, 0, "choices"),
});
let previous = "";
function handler(regs, index, offset, hookname) {
  const address = regs[index].value.add(offset);

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  /* processString */
  // @w \nけど……#STAND\TOOY01A_N.bmp 3#微妙だっ $お姫様$』 \d
  let s = address.readShiftJisString()
      .replace(/(\\n)+/g, ' ')
      .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '') // #.*?# <=> #[^#]+.
      ;
  
  if (s === previous) {
    return null;
  }
  previous = s;
  return s;
}
