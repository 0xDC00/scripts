// ==UserScript==
// @name         [PCSG00510] Starry☆Sky ~Spring Stories~ / Starry Sky ~Spring Stories~
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * honeybee
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x8003542e: mainHandler.bind_(null, 3, 0x0, "name"),
  0x80033f2e: mainHandler.bind_(null, 0, 0x0, "text"),
  0x8002c5b8: mainHandler.bind_(null, 0, 0x8, "choice"),
});

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.add(offset).readShiftJisString().replace(/%N/g, "");

  return s;
}
