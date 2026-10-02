// ==UserScript==
// @name         [01005E5023A0A000] Sullyland Nursery Rhyme
// @version      1.0.0
// @author       GO123
// @description  
// * Otomate
// * Design Factory Co., Ltd. & Otomate & Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, '200++');

setHook(
  {
    "1.0.0": {
      [0x8003ed60 - 0x80004000]: mainHandler.bind_(null, 0, 0, "text"),
      [0x80068b90 - 0x80004000]: mainHandler.bind_(null, 1, 0, "info"),
      [0x80027a70 - 0x80004000]: mainHandler.bind_(null, 2, 0, "name"),
      [0x800a2f4c - 0x80004000]: mainHandler.bind_(null, 0, 0, "dictionary in extra1"),
	    [0x800a2f74 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dictionary in extra2"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
 // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.add(offset).readUtf8String()
  s = " " + s.replaceAll(/#Type\[\d+\]|#Color\[\d+\]|#Ruby|#n/g, '');

  return s;
}
