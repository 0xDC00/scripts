// ==UserScript==
// @name         [0100FA001E160000] 7'scarlet
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate & Toybox Inc.
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x8177ec00 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x817754ac - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(0x14)
    .readUtf16String()
    .replace(/\r\n/g, "")
    .replace(/\u3000/gu, "");

  return s;
}
