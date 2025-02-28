// ==UserScript==
// @name         [01001BA01EBFC000] Moeyo! Otome Doushi ~Kayuu Koigatari~ (燃えよ！ 乙女道士 ～華遊恋語～)
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * Otomate
// * Design Factory Co., Ltd. & Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x8005c698 - 0x80004000]: mainHandler.bind_(null, 1, 0x20, "text"),
      [0x80051cd0 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(offset)
    .readUtf8String()
    .replace(/#n/g, "")
    .replace(/#\w+(\[.+?\])?/g, "");

  return s;
}
