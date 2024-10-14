// ==UserScript==
// @name         [01000E701DAE8000] Natsuzora no Monologue ~Another Memory~
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * Design Factory & Otomate
// * Idea Factory
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");
const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x8006007c - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"), // dialogue & names
      [0x800578c4 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const reg = regs[index];
  const address = reg.value;

  /* processString */
  let s = address.readShiftJisString();
  s = s
    .replace(/(#n)+/g, " ")
    .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, "")
    .replace(/\u3000+/gu, "");

  return s;
}
