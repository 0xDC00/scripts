// ==UserScript==
// @name         [0100B6900A668000] Code: Realize ~Saikou no Hanataba~ (Code：Realize ～彩虹の花束～)
// @version      1.0.0
// @author       [Owlie], Mansive
// @description  Yuzu/Sudachi, Ryujinx
// * -Design Factory Co., Ltd. & Otomate
// *
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x80019c14 - 0x80004000]: mainHandler.bind_(null, 0, 0x1c, "text"),
      [0x80041560 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice"),
      [0x800458c8 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dict"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter:", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.add(offset).readUtf8String();
  s = s.replace(/#\w+(\[.+?\])?/g, "").replace(/\u3000/gu, "");

  if (s === "" || s === previous) {
    return null;
  }
  previous = s;

  return s;
}
