// ==UserScript==
// @name         [010079D02431E000] Kimi ni Madoi, Kimi ni Oboreru. / 君に惑い、君に溺れる。
// @version      1.0.0
// @author       Mansive
// @description  Yuzu
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler, 300);

setHook(
  {
    "1.0.0": {
      [0x8003db10 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dialogue"),
      [0x800569f0 - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice"),
      // [0x800443b4 - 0x80004000]: mainHandler.bind_(null, 0, 0, "chapter title"),
      [0x800690fc - 0x80004000]: mainHandler.bind_(null, 1, 0x20, "center banner"),
      [0x8006ad1c - 0x80004000]: dictHandler.bind_(null, 0, 0, "dictionary"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)],
);

function handler(regs, index, offset, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.add(offset).readUtf8String();
  // console.warn(JSON.stringify(s));

  s = s.replace(/^\u{3000}/gu, ""); // remove beginning whitespace
  s = s.replace(/#n/g, "\n") // proper newlines
  s = s.replace(/#[^\]]+\]/g, "");

  return s;
}
