// ==UserScript==
// @name         [010051701A7BE000] Wand of Fortune R2 FD ~Kimi ni Sasageru Epilogue~ (ワンド オブ フォーチュン２ FD ～君に捧げるエピローグ～)
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      Ha9b2cf6f4d0bfe76: mainHandler.bind_(null, 0, "name"),
      H6334e8ad8bbcf969: mainHandler.bind_(null, 0, "text"),
      Hde8f0580587f1f6c: mainHandler.bind_(null, 0, "choice"),
      H6390233a04312065: mainHandler.bind_(null, 0, "extra"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const len = address.add(0x10).readU16() * 2;
  const s = address
    .add(0x14)
    .readUtf16String(len)
    .replace(/^\u3000|\n\u3000?/gu, "") // single line
    .replace(/<[^>]+>/g, "")
    .trimEnd();

  if (s === "") {
    return null;
  }

  return s;
}
