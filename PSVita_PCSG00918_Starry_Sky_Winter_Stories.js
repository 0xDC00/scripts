// ==UserScript==
// @name         [PCSG00916] Starry☆Sky ~Winter Stories~ / Starry Sky ~Winter Stories~
// @version      1.00 + 1.01
// @author       Mansive
// @description  Vita3K
// * honeybee
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x80035a20: mainHandler.bind_(null, 3, 0x0, "name"),
  0x80034500: mainHandler.bind_(null, 0, 0x0, "text"),
  0x8002cb66: mainHandler.bind_(null, 0, 0x8, "choice"),
});

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.add(offset).readShiftJisString().replace(/%N/g, "");

  return s;
}
