// ==UserScript==
// @name         [01003BB01DF54000] My9Swallows TOPSTARS LEAGUE
// @version      1.0.0, 1.0.1
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook(
  {
    "1.0.0": {
      [0x818554ac - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x817b76d4 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
    },
    "1.0.1": {
      [0x8187882c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x817b8f64 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const len = address.add(0x10).readU32() * 2;
  let s = address
    .add(0x14)
    .readUtf16String(len)
    .replace(/\\\u3000*/gu, "") // single line, remove fullwidth whitespace
    .replace(/\$/g, "");

  return s;
}
