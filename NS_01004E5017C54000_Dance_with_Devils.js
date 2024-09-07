// ==UserScript==
// @name         [01004E5017C54000] Dance with Devils
// @version      1.0.0
// @author       Mansive
// @description  Yuzu / Ryujinx
// * Rejet
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x81616034 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8185a800 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(0x14)
    .readUtf16String()
    .replace(/<.+?>/g, "") // remove <br> tags
    .replace(/\u3000/gu, ""); // remove fullwidth whitespace

  return s;
}
