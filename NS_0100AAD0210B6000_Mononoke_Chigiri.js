// ==UserScript==
// @name         [0100AAD0210B6000] Mononoke Chigiri (勿ノ怪契リ)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictMenuHandler = trans.send(handler2, "500");

setHook(
  {
    "1.0.0": {
      [0x818f96e8 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x817d0714 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x8195bc7c - 0x80004000]: mainHandler.bind_(null, 0, "dict popup"),
      [0x81862bd0 - 0x80004000]: dictMenuHandler.bind_(null, 5, "dict menu"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, name) {
  console.log("onEnter:", name);

  const address = regs[index].value;

  const len = address.add(0x10).readU32();
  let s = address.add(0x14).readUtf16String(len);

  // console.warn(JSON.stringify(s));

  s = s
    .replace(/\\\u{3000}?/gu, "") // single line
    .replace(/#([^#]+)#\[[^\]]+\]/g, "$1") // furigana
    .replace(/\+/g, " ") // what
    .replace(/\$/g, ""); // colored text

  return s;
}

function handler2(regs, index, name) {
  console.log("onEnter:", name);

  const address1 = regs[1].value;
  const len1 = address1.add(0x10).readU32();

  if (len1 === 0) {
    return null;
  }

  const address2 = regs[3].value;
  const len2 = address2.add(0x10).readU32();

  const word = address1.add(0x14).readUtf16String(len1);
  const meaning = address2.add(0x14).readUtf16String(len2);

  return word + "\n" + meaning;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  return s.replace(/"/g, ""); // dict
});
