// ==UserScript==
// @name         [PCSG00745] Scared Rider Xechs Rev. (スカーレッドライダーゼクス Rev.)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * RED
// * Rejet
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
  0x8000c2d4: mainHandler.bind_(null, 12, 0x8, "text"),
});

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  console.log("onEnter:", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.add(offset).readUtf8String().replace(/\n/g, ""); // single line

  if (s === "") {
    return null;
  }

  return s;
}
