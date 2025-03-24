// ==UserScript==
// @name         [PCSG00787] Kyoukai no Shirayuki (鏡界の白雪)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
  0x80025f0e: mainHandler.bind_(null, 5, 0x2, "name"),
  0x80025f1a: mainHandler.bind_(null, 6, 0x2, "text"),
  0x80141978: mainHandler.bind_(null, 1, 0x1, "choice"),
});

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  console.log("onEnter:", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.readUtf8String().replace(/\\/g, ""); // single line

  if (s === "") {
    return null;
  }

  return s;
}
