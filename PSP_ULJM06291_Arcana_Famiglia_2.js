// ==UserScript==
// @name         [ULJM06291] Arcana Famiglia 2
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * HuneX
// * Comfort
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x889c6d0: mainHandler.bind_(null, 1, 2, "dialogue"),
  0x88c1cc4: mainHandler.bind_(null, 1, 0, "wall of text"),
});

function handler(regs, index, offset, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address
    .add(offset)
    .readShiftJisString()
    .replace(/@n/g, "") // single line
    .replace(/@\w|＄/g, "") // stuff
    .replace(/\u3000{2,}/gu, "\n"); // newline for header of big white wall of text

  return s;
}
