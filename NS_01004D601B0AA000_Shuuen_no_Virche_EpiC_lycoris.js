// ==UserScript==
// @name         [01004D601B0AA000] Shuuen no Virche -EpiC:lycoris-
// @version      1.0.1
// @author       Mansive
// @description  Yuzu
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms
const dictHandler = trans.send(handler2, "200+");

setHook(
  {
    "1.0.1": {
      [0x8002bf6c - 0x80004000]: mainHandler.bind_(null, 0, 0x1c, "text"),
      [0x8004e720 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choices"),
      // [0x8003f9c4 - 0x80004000]: mainHandler.bind_(null, 0, 0, "popup word"), // called before popup opens
      // [0x80052870 - 0x80004000]: mainHandler.bind_(null, 0, 0, "popup meaning"), // ^
      [0x800655b0 - 0x80004000]: dictHandler.bind_(null, 0, 0, "word"), // menu dictionary
      [0x800655c8 - 0x80004000]: dictHandler.bind_(null, 0, 0, "meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";
let previousWord = "";
let previousMeaning = "";

function handler(regs, index, offset, hookname) {
  // console.log("onEnter: ", hookname);
  const address = regs[index].value;

  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
  let s = address.add(offset).readUtf8String();

  if (s === previous) {
    return null;
  }
  previous = s;

  // fine to reset dict vars now
  previousWord = "";
  previousMeaning = "";

  return s;
}

function handler2(regs, index, offset, hookname) {
  // console.log("onEnter: ", hookname);
  const address = regs[index].value;

  let s = address.add(offset).readUtf8String();

  if (hookname === "word") {
    if (s === previousWord) {
      return null;
    }
    previousWord = s;
  } else if (hookname === "meaning") {
    if (s === previousMeaning) {
      return null;
    }
    previousMeaning = s;
  }

  return s;
}

trans.replace((s) => {
  // print rubi
  const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
  for (const rubi of rubis) {
    console.log("rubi: " + rubi[3]);
    console.log("rube: " + rubi[2]);
  }
  // remove rubi
  s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, "$2");
  // remove icon

  // remove controls
  s = s.replace(/#Color\[[\d]+\]/g, "");

  s = s.replace(/(　#n)+/g, "#n"); // \s?
  s = s.replace(/#n+/g, ""); // single line

  return s;
});
