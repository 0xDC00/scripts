// ==UserScript==
// @name         [010032300C562000] LoverPretend / Lover Pretend
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200++");
const mainHandler2 = trans.send(handler, "200+");
const dictHandler = trans.send(handler, 300);

setHook(
  {
    "1.0.0": {
      [0x80034ad0 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8004e950 - 0x80004000]: mainHandler2.bind_(null, 1, "choices"),
      [0x8002e6c4 - 0x80004000]: mainHandler.bind_(null, 0, "phone"),
      // [0x8005f6c8 - 0x80004000]: dictHandler.bind_(null, 0, "word"),
      [0x8005f6ec - 0x80004000]: dictHandler.bind_(null, 0, "meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, hookname) {
  // console.log("onEnter: ", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/(#Ruby\[)([^,]+),(#\w+\[.\])?(.+?])/g, "$2") // '#Ruby[光葉,#Type[2]こうよう]' to '光葉'
    .replace(/#\w+(\[.+?\])?/g, "") // remove controls
    .replace(/\u3000/gu, ""); // remove fullwidth whitespace

  if (s === "" || s === previous) {
    return null;
  }
  previous = s;

  return s;
}
