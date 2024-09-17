// ==UserScript==
// @name         [PCSG01066] Chouchou Jiken Lovesodic / Chouchou Jiken Rhapsodic (蝶々事件ラブソディック)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * RED
// * Idea Factory Co., Ltd. & Otomate
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  // 0x80090fe0: mainHandler.bind_(null, 11, "name"),
  0x8008dea2: mainHandler.bind_(null, 4, "text"),
  0x8008eb38: mainHandler.bind_(null, 0, "choice"),
});

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String().replace(/\n\u3000*/gu, "");

  return s;
}
