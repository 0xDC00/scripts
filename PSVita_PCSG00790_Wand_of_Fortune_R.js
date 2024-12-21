// ==UserScript==
// @name         [PCSG00790] Wand of Fortune R (ワンドオブフォーチュン R)
// @version      1.00, 1.01
// @author       Mansive
// @description  Vita3K
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.01";

const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.00": {
      0x8008128a: mainHandler.bind_(null, 0, "name"),
      0x800812b4: mainHandler.bind_(null, 0, "text"),
      0x8002cb84: mainHandler.bind_(null, 8, "choice"),
    },
    1.01: {
      0x8008134e: mainHandler.bind_(null, 0, "name"),
      0x80081378: mainHandler.bind_(null, 0, "text"),
      0x8002cb8c: mainHandler.bind_(null, 8, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

console.warn(`Game version: ${gameVer}`);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address
    .readUtf8String()
    .replace(/([^。…？！])\u3000/gu, "$1") // concat broken-up sentences
    .replace(/^\u3000/gu, "")
    .replace(/#n/g, ""); // remove control from choice

  return s;
}
