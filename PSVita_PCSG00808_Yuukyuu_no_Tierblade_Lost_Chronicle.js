// ==UserScript==
// @name         [PCSG00808] Yuukyuu no Tierblade -Lost Chronicle- (悠久のティアブレイド -Lost Chronicle-)
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
  0x8003542a: mainHandler.bind_(null, 10, "text"),
  // 0x8001492c: mainHandler.bind_(null, 8, "name"),
  0x8002a95a: mainHandler.bind_(null, 6, "choice"),
  0x801a98aa: mainHandler.bind_(null, 9, "junk"), // menu named "junk"
  0x801a42bc: mainHandler.bind_(null, 9, "dict word"),
  0x801a42d0: mainHandler.bind_(null, 7, "dict meaning"),
});

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/^\s+|\s+$/g, "")
    .replace(/\s*(#n)*\s*/g, "")
    .replace(/#\w+(\[.+?\])?/g, "");

  if (s === "") {
    return null;
  }

  return s;
}
