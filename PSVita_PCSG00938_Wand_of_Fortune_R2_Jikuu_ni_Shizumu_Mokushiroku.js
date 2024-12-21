// ==UserScript==
// @name         [PCSG00938] Wand of Fortune R2 ~Jikuu ni Shizumu Mokushiroku~ (ワンド オブ フォーチュン Ｒ２ ～時空に沈む黙示録～)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x8006c986: mainHandler.bind_(null, 0, 0x0, "name"),
  0x8006c9b0: mainHandler.bind_(null, 0, 0x0, "text"),
  0x8001a860: mainHandler.bind_(null, 8, 0x0, "choice"),
  0x80022bd2: mainHandler.bind_(null, 4, 0x14, "dict name"),
  0x80022bf0: mainHandler.bind_(null, 5, 0x0, "dict text"),
});

let previous = "";

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.add(offset).readUtf8String();

  return s;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  s = s
    .replace(/([^。…？！])\u3000/gu, "$1") // concat broken-up sentences
    .replace(/^\u3000/gu, "")
    .replace(/#n/g, "") // remove control from choice
    .replace(/#\w+\[\d+\]|!/g, ""); // "#Link[108]あら!" -> "あら"

  return s;
});
