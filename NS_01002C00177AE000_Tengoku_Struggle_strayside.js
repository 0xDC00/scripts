// ==UserScript==
// @name         [01002C00177AE000] Tengoku Struggle -strayside-
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const popupHandler = trans.send(handler, -200); // get only meaning

setHook(
  {
    "1.0.0": {
      [0x801bc678 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8016a05c - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
      [0x80140cac - 0x80004000]: popupHandler.bind_(null, 1, "popup dict"),
      // [0x800e0ba0 - 0x80004000]: mainHandler.bind_(null, 1, "menu dict"), // word + meaning
      [0x800e08dc - 0x80004000]: mainHandler.bind_(null, 0, "menu dict"), // only meaning
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf32StringLE()
    .replace(/#\w\(.+?\)|#\w{2}/g, "") // remove junk
    .replace(/\n/g, "") // single line
    .replace(/\u3000/gu, ""); // remove fullwidth spaces

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
