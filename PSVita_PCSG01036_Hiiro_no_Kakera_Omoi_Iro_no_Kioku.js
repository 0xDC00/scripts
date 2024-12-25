// ==UserScript==
// @name         [PCSG01036] Hiiro no Kakera ~Omoi Iro no Kioku~ (緋色の欠片 ～おもいいろの記憶～)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler2, "200+");

setHook({
  0x8007838c: mainHandler.bind_(null, 5, "text"),
  0x8001154c: mainHandler.bind_(null, 8, "choice"),
  0x800879ee: mainHandler.bind_(null, 2, "omikuji"),
  0x8008f074: dictHandler.bind_(null, 9, "dictionary"),
});

let previous = "";

function handler(regs, index, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String();

  return s;
}

function handler2(regs, index, hookname) {
  // console.log("onEnter:", hookname);

  const address1 = regs[0].value; // type

  if (address1.readUtf8String() !== "file_data") {
    return null;
  }

  const address2 = regs[1].value; // text
  const s = address2.readUtf8String();

  return s;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  s = s.replace(/#n/g, ""); // single line

  return s;
});
