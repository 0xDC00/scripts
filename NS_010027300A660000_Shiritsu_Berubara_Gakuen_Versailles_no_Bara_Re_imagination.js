// ==UserScript==
// @name         [010027300A660000] Shiritsu Berubara Gakuen ~Versailles no Bara Re*imagination~ (私立ベルばら学園 ～ベルサイユのばらRe*imagination～)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x8001b68c - 0x80004000]: mainHandler.bind_(null, 0, 0x1c, "text"),
      [0x800460f0 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice"),
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
    .replace(/#n\u3000*/gu, "");

  return s;
}
