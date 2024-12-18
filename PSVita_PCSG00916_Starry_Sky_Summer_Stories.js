// ==UserScript==
// @name         [PCSG00916] Starry☆Sky ~Summer Stories~ / Starry Sky ~Summer Stories~
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * honeybee
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x80035634: mainHandler.bind_(null, 3, "name"),
  0x80034114: mainHandler.bind_(null, 0, "text"),
});

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString().replace("%N", "");

  return s;
}
