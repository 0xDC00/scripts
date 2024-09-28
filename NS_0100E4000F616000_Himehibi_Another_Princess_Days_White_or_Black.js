// ==UserScript==
// @name         [0100E4000F616000] Himehibi Another Princess Days -White or Black- (ひめひび Another Princess Days – White or Black –)
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * TAKUYO
// ==/UserScript==
const gameVer = "1.0.0";

globalThis.ARM = true;
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      // [0x21ca64 - 0x204000]: mainHandler.bind_(null, 4, "name"),
      [0x219ed0 - 0x204000]: mainHandler.bind_(null, 0, "text"),
      [0x21a3e0 - 0x204000]: mainHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readShiftJisString()
    // .replace(/@\w+|^\s+|\s+$/g, "") // cleanup name
    .replace(/\\\w/g, "");

  return s;
}
