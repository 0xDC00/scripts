// ==UserScript==
// @name         [PCSG01075] Yuukyuu no Tierblade -Fragments of Memory- (悠久のティアブレイド -Fragments of Memory-)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

// const mainHandler = trans.send(handler, "700+"); // lines up name with text but very slow
const mainHandler = trans.send(handler, "200+");

setHook({
  0x80035f44: mainHandler.bind_(null, 10, "text"),
  0x8000d868: mainHandler.bind_(null, 9, "text NVL"),
  // 0x80015098: mainHandler.bind_(null, 8, "name"),
  0x8004598e: mainHandler.bind_(null, 0, "title screen"),
  0x801b1d16: mainHandler.bind_(null, 9, "junk"), // menu named "junk"
  0x801ac31e: mainHandler.bind_(null, 9, "dict word"),
  0x801ac33a: mainHandler.bind_(null, 7, "dict meaning"),
  // fragment descriptions
  0x801b879a: mainHandler.bind_(null, 5, "frag vertical"), // vertical timeline movement
  0x8009f570: mainHandler.bind_(null, 5, "frag horizontal"), // horizontal timeline movement
});

let open = true;
let previous = "";

function handler(regs, index, hookname) {
  // console.log("onEnter: ", hookname);

  if (hookname === "text") {
    // frag H can be called in backlog; disable it when advancing text
    open = false;
  } else if (hookname === "title screen") {
    // we're back in title screen, so it's fine to re-enable frag H
    open = true;
    return null;
  } else if (open === false && hookname === "frag horizontal") {
    return null;
  }

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/^\s+|\s+$/g, "")
    .replace(/\s*(#n)*\s*/g, "")
    .replace(/#\w+(\[.+?\])?/g, "");

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
