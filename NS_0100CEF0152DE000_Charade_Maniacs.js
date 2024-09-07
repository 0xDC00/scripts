// ==UserScript==
// @name         [0100CEF0152DE000] Charade Maniacs / CharadeManiacs
// @version      1.0.0
// @author       Mansive
// @description  Yuzu / Ryujinx
// * Otomate & Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x8001c460 - 0x80004000]: mainHandler.bind_(null, 0, 0x5c, "text"),
      [0x8004c390 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choices"),
      [0x80050d60 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dictionary"),
      [0x8007ee20 - 0x80004000]: mainHandler.bind_(null, 0, 0, "materials"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  let address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(offset)
    .readUtf8String()
    .replace(/\u3000/gu, "") // remove fullwidth whitespace
    .replace(/#n/g, "")
    .replace(/#\w.+?]/g, ""); // remove #Color[69] stuff

  return s;
}
