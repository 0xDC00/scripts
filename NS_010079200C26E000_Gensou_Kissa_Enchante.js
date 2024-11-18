// ==UserScript==
// @name         [010079200C26E000] Gensou Kissa Enchanté
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200++");
const choiceHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler2, "300");

setHook(
  {
    "1.0.0": {
      // [0x800283d4 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x8002863c - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
      [0x80044360 - 0x80004000]: choiceHandler.bind_(null, 1, "choices"),
      [0x8004a1a4 - 0x80004000]: dictHandler.bind_(null, 0, "dict word"),
      [0x8004a394 - 0x80004000]: dictHandler.bind_(null, 0, "dict meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previousDictWord = "";
let previousDictMeaning = "";

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);
  const address = regs[index].value;

  let s = address.readUtf8String();
  // console.log(s);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  // it's fine to clear stored text now
  previousDictWord = "";
  previousDictMeaning = "";

  return s;
}

function handler2(regs, index, hookname) {
  const address = regs[index].value;
  let s = address.readUtf8String().replace(/#n/g, "");

  if (hookname === "dict word") {
    if (s === previousDictWord) {
      return null;
    }
    previousDictWord = s;
  } else if (hookname === "dict meaning") {
    if (s === previousDictMeaning) {
      return null;
    }
    previousDictMeaning = s;
  }

  return s;
}
