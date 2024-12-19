// ==UserScript==
// @name         [PCSG00917] Starry☆Sky ~Autumn Stories~ / Starry Sky ~Autumn Stories~
// @version      1.00, 1.01
// @author       Mansive
// @description  Vita3K
// * honeybee
// ==/UserScript==
const gameVer = "1.01";

const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.00": {
      0x80035b10: mainHandler.bind_(null, 3, 0x0, "name"),
      0x800345f0: mainHandler.bind_(null, 0, 0x0, "text"),
      0x8002cc56: mainHandler.bind_(null, 0, 0x8, "choice"),
    },
    1.01: {
      0x80035b2c: mainHandler.bind_(null, 3, 0x0, "name"),
      0x8003460c: mainHandler.bind_(null, 0, 0x0, "text"),
      0x8002cc72: mainHandler.bind_(null, 0, 0x8, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.add(offset).readShiftJisString().replace(/%N/g, "");

  return s;
}
