// ==UserScript==
// @name         [0100F8D0129F4000] Himehibi -Princess Days- (ひめひび -Princess Days-)
// @version      1.0.0, 1.0.1
// @author       Mansive
// @description  Ryujinx
// * TAKUYO
// ==/UserScript==
const gameVer = "1.0.1";

globalThis.ARM = true;
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      // [0x20ee68 - 0x204000]: mainHandler.bind_(null, 1, "name"),
      [0x20d7b8 - 0x204000]: mainHandler.bind_(null, 0, "text"),
      [0x20da9c - 0x204000]: mainHandler.bind_(null, 0, "choice"),
    },
    "1.0.1": {
      // [0x20eeb4 - 0x204000]: mainHandler.bind_(null, 1, "name"),
      [0x20d834 - 0x204000]: mainHandler.bind_(null, 0, "text"),
      [0x20dae8 - 0x204000]: mainHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readShiftJisString()
    // .replace(/^\s+|\s+$/g, "") // cleanup name
    .replace(/\\\w/g, "");

  return s;
}
