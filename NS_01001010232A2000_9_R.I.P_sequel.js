// ==UserScript==
// @name         [01001010232A2000] 9 R.I.P. sequel
// @version      1.0.0
// @author       Mansive (regex from Koukdw)
// @description
// * Design Factory & Otomate
// * Idea Factory (アイディアファクトリー)
// *
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "205+");
const nameHandler = trans.send(handler, "200+");

let timer = null;
let topText = "";
let bottomText = "";
let previous = "";

function orderedHandler() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send(topText + "\r\n" + bottomText);
    topText = "";
    bottomText = "";
  }, 500);
}

function topHandler() {
  (topText = handler(...arguments)) && orderedHandler();
}

function bottomHandler() {
  (bottomText = handler(...arguments)) && orderedHandler();
}

setHook(
  {
    "1.0.0": {
      // [0x800617f0 - 0x80004000]: nameHandler.bind_(null, 2, 0, "name"),
      [0x800242a0 - 0x80004000]: mainHandler.bind_(null, 0, 0x5c, "text"),
      [0x80054d00 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice"),
      [0x8007c800 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice 2"),
      [0x80068bec - 0x80004000]: topHandler.bind_(null, 0, 0, "dict name"),
      [0x80068c10 - 0x80004000]: bottomHandler.bind_(null, 0, 0, "dict meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;

  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
  const s = address.add(offset).readUtf8String();
  // console.warn(JSON.stringify(s));

  return s;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  return s
    .replace(/(#n)+\u{3000}?/gu, " ") // Single line
    .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, "") // Remove controls
    .trim();
});
