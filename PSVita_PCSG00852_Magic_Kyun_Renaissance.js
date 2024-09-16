// ==UserScript==
// @name         [PCSG00852] Magic Kyun! Renaissance (マジきゅんっ！ルネッサンス)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * HuneX
// * Broccoli
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  // 0x8001b29c: mainHandler.bind_(null, 5, "name"),
  0x8008375a: mainHandler.bind_(null, 1, "text"),
  0x8001c194: mainHandler.bind_(null, 1, "choice"),
});

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString().replace(/\^/g, "").replace(/�L/g, " ");

  if (s === "") {
    return null;
  }

  return s;
}
