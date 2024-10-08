// ==UserScript==
// @name         [0100FB301E70A000] Honey Vibes
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler, 500); // less spam when scrolling through list

setHook(
  {
    "1.0.0": {
      Hb98c1259197a7df0: mainHandler.bind_(null, 0, "text"),
      H10495dda40a4e0ff: mainHandler.bind_(null, 0, "choice"),
      Hc0ffdda3dbdbffde: mainHandler.bind_(null, 0, "dict popup"),
      // H872e98b602eada13: mainHandler.bind_(null, 0, "dict word"),
      H3816cf35ede5cd22: dictHandler.bind_(null, 0, "dict meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const len = address.add(0x10).readU32() * 2;
  let s = address.add(0x14).readUtf16String(len);

  if (s === previous) {
    return null;
  }
  previous = s;

  s = s.replace(/\\\u3000*/gu, "").replace(/\$/g, "");

  return s;
}
