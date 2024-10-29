// ==UserScript==
// @name         [0100B6900A668000] Code: Realize ~Shirogane no Kiseki~ (Code:Realize ～白銀の奇跡～)
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler, "300+");

setHook(
  {
    "1.0.0": {
      H74b1cd1cc940d24e: mainHandler.bind_(null, 0, "text"),
      H57b424a8ba71d2de: mainHandler.bind_(null, 11, "dict popup"),
      H364c8f618d78c327: dictHandler.bind_(null, 20, "dict menu"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter:", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const len = address.add(0x10).readU32() * 2;
  let s = address
    .add(0x14)
    .readUtf16String(len)
    .replace(/\n\u3000*|#n/gu, "");

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
