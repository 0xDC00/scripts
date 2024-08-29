// ==UserScript==
// @name         [0100FA10185B0000] SympathyKiss / Sympathy Kiss (JP)
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
const dictHandler = trans.send(handler2, "200+");

setHook(
  {
    "1.0.0": {
      [0x80037d90 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x80030f24 - 0x80004000]: mainHandler.bind_(null, 0, "phone"),
      [0x80054804 - 0x80004000]: choiceHandler.bind_(null, 1, "choices 1"), // fancy choices
      [0x80054290 - 0x80004000]: choiceHandler.bind_(null, 1, "choices 2"), // plain choices
      [0x8005f504 - 0x80004000]: dictHandler.bind_(null, 1, "popup word"),
      [0x8005f5f4 - 0x80004000]: dictHandler.bind_(null, 1, "popup meaning"),
      [0x8007cb50 - 0x80004000]: dictHandler.bind_(null, 0, "menu word"),
      [0x8007cbc0 - 0x80004000]: dictHandler.bind_(null, 0, "menu meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previousWord = "";
let previousMeaning = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String().replace(/#.+?]/g, ""); // remove #Color[21] stuff

  previousWord = "";
  previousMeaning = "";

  return s;
}

function handler2(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);

  let s = address.readUtf8String();

  if (s === previousWord || s === previousMeaning) {
    return null;
  }

  if (hookname === "popup word" || hookname === "menu word") {
    previousWord = s;
  } else if (hookname === "popup meaning" || hookname === "menu meaning") {
    previousMeaning = s;
  }

  s = s.replace(/#n/g, "");

  return s;
}
