// ==UserScript==
// @name         [ULJM06393] Omertà ~Chinmoku no Okite~ The Legacy / Omerta (オメルタ～沈黙の掟～ THE LEGACY)
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * Karin Chatnoir Ω
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x8885fd8: mainHandler.bind_(null, 0, "name"),
  0x88861e0: mainHandler.bind_(null, 3, "text"),
  // 0x8889f40: mainHandler.bind_(null, 1, "timed choice"), // less calls but extra garbage line
  0x88ac3a8: mainHandler.bind_(null, 1, "timed choice"), // more calls but cleaner
});

console.log(`
  If PPSSPP is flickering on button presses, disable "Skip buffer effects".
`);

function handler(regs, index, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  // remove fullwidth whitespace at start
  const s = address.readShiftJisString().replace(/^\u3000/gu, "");

  return s;
}
