// ==UserScript==
// @name         [PCSG00815] PsychicEmotion6 (サイキックエモーション ムー)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x80035948: mainHandler.bind_(null, 9, "text"),
  0x80034580: mainHandler.bind_(null, 6, "choice"),
});

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/\s*(#n)*\s*/g, "")
    .replace(/#\w+(\[.+?\])?/g, ""); // Not sure if needed but using just in case

  return s;
}
