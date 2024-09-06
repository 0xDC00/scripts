// ==UserScript==
// @name         [01005AF00E9DC000] Tokeijikake no Apocalypse (時計仕掛けのアポカリプス)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook(
  {
    "1.0.0": {
      [0x8001d9c4 - 0x80004000]: mainHandler.bind_(null, 0, 0x1c, "text"),
      [0x8004ca84 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choices"),
      [0x8005b304 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dict word"),
      [0x8005b310 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dict meaning"),
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
    .replace(/#n/g, "") // single line
    .replace(/#\w+(\[.+?\])?/g, ""); // removes #Color[5] stuff

  return s;
}
