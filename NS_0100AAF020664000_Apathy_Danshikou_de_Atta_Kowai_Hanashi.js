// ==UserScript==
// @name         [0100AAF020664000] Apathy - Danshikou de Atta Kowai Hanashi
// @version      1.0.1
// @author       kenzy
// @description  Sudachi, Ryujinx
// * Shannon
// * Mebius
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");
const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.1": {
      [0x8008eb00 - 0x80004000]: mainHandler.bind_(null, 1, "text"),
      [0x80009388 - 0x80004000]: mainHandler.bind_(null, 10, "names"),
      [0x80014a64 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;
  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf32StringLE()
  s = s.replace(/\n/g, "") // single line
       .replace(/\u3000/gu, ""); // remove fullwidth spaces

  return s;
}
