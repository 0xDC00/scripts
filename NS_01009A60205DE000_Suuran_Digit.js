// ==UserScript==
// @name         [01009A60205DE000] Suuran Digit (数乱digit)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

globalThis.ARM = true;
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x2388a0 - 0x204000]: mainHandler.bind_(null, 0, "text"),
      [0x2383e8 - 0x204000]: mainHandler.bind_(null, 0, "name"),
      [0x23840c - 0x204000]: mainHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  // console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address
    .readUtf8String()
    .replace(/\\\u{3000}/gu, "") // single line
    .replace(/\\/g, "\n") // multi line choice
    .replace(/#/g, ""); // color

  return s;
}
