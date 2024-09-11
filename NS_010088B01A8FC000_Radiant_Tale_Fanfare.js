// ==UserScript==
// @name         [010088B01A8FC000] Radiant Tale ~Fanfare!~ (ラディアンテイル ～ファンファーレ！～)
// @version      1.0.1
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200++");
// const dictHandler = trans.send(handler2, "300+"); // for both word and meaning
const dictHandler = trans.send(handler, 300); // less spam when scrolling through list

setHook(
  {
    "1.0.1": {
      [0x8003a880 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8004eb08 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
      // popup dictionary
      // [0x8005bfd0 - 0x80004000]: dictHandler.bind_(null, 0,　"word"),
      [0x8005bff4 - 0x80004000]: dictHandler.bind_(null, 0, "meaning"),
      // menu dictionary
      // [0x8005f340 - 0x80004000]: dictHandler.bind_(null, 1,　"word"),
      [0x8005f0d4 - 0x80004000]: dictHandler.bind_(null, 3, "meaning"),
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
    .replace(/#\w+(\[.+?\])?/g, "") // remove controls
    .replace(/\u3000/gu, ""); // remove fullwidth whitespace

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
