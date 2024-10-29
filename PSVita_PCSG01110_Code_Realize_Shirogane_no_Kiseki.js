// ==UserScript==
// @name         [PCSG01110] Code: Realize ~Shirogane no Kiseki~ (Code:Realize ～白銀の奇跡～)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
  0x80015bcc: mainHandler.bind_(null, 0, 0x1c, "text"),
  0x80038e76: mainHandler.bind_(null, 8, 0, "dict"),
});

let previous = "";

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(offset)
    .readUtf8String()
    .replace(/#\w+(\[.+?\])?/g, "")
    .replace(/\u3000/gu, "");

  if (s === "" || s === previous) {
    return null;
  }
  previous = s;

  return s;
}
