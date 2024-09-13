// ==UserScript==
// @name         [01001A500AD6A000] Norn9 ~Norn + Nonette~ LOFN (NORN9 ~ノルン+ノネット~ LOFN)
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * Otomate & Regista
// * Idea Factory Co., Ltd. & Littlesugar
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200");
const mainHandler2 = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x8002b200 - 0x80004000]: mainHandler.bind_(null, 1, 0x18, "text"),
      // [0x8002c930 - 0x80004000]: mainHandler2.bind_(null, 1, 0, "name + text"), // scuffed
      [0x8003d83c - 0x80004000]: mainHandler2.bind_(null, 0, 0, "choice"),
      [0x80047850 - 0x80004000]: mainHandler2.bind_(null, 0, 0, "timed choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  // console.log("onEnter: ", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(offset)
    .readUtf8String()
    .replace(/%\w+/g, "")
    .replace(/\u3000/gu, "");

  if (s === "") {
    return null;
  }

  return s;
}
