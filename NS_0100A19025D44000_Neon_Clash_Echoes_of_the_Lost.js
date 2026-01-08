// ==UserScript==
// @name         [0100A19025D44000] Neon Clash -Echoes of the Lost- (ネオンクラッシュ -Echoes of the Lost-)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu
// * Amulit
// * Voltage Inc.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

let timer = -1;
function scrollHandler(text) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send(text);
  }, 500);
}

const indexToMeaning = new Map(); // 33 entries
const meanings = new Set();
let dictIndex = 0;

setHook(
  {
    "1.0.0": {
      [0x81c3e95c - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
      [0x836b5f68 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x81b06bd4 - 0x80004000]: mainHandler.bind_(null, 0, "popup"),
      // [0x81bce904 - 0x80004000]: dictListHandler.bind_(null, 0, "dict meaning"),
      // [0x81bceb98 - 0x80004000]: dictCursorHandler.bind_(null, 0, "dict cursor up"),
      // [0x81bceca8 - 0x80004000]: dictCursorHandler.bind_(null, 0, "dict cursor down"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

console.warn(`
Dictionary hooks are disabled by default.
To enable them, uncomment them in the script.
`);

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);
  const address = regs[index].value;

  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
  const len = address.add(0x10).readU32();
  let s = address.add(0x14).readUtf16String(len);

  s = s.replace(/<\/?color[^>]*>/g, "");
  s = s.replace(/"/g, ""); // special choices

  return s;
}

function dictListHandler(regs, index, hookname) {
  // console.log("onEnter: " + hookname);

  dictIndex = 0;
  const address = regs[index].value;

  const len = address.add(0x10).readU32();
  const meaning = address.add(0x14).readUtf16String(len);

  if (meanings.has(meaning)) {
    indexToMeaning.clear();
    meanings.clear();
  }

  if (indexToMeaning.size === 0) {
    mainHandler(...arguments);
  }

  indexToMeaning.set(indexToMeaning.size, meaning);
  meanings.add(meaning);
}

function dictCursorHandler(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  if (hookname.endsWith("up")) {
    dictIndex -= 1;
    if (dictIndex < 0) {
      dictIndex = 32;
    }
  } else if (hookname.endsWith("down")) {
    dictIndex += 1;
    if (dictIndex > 32) {
      dictIndex = 0;
    }
  } else {
    console.error("Unexpected error with", hookname);
  }

  const meaning = indexToMeaning.get(dictIndex) ?? "";
  scrollHandler(meaning);
}

trans.replace((s) => {
  // console.warn(JSON.stringify(s));

  s = s.replace(/([^。…？！])\n\u{3000}?|<br>/gu, "$1");

  return s;
});
