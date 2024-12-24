// ==UserScript==
// @name         [ULJM05802] Bara no Ki ni Bara no Hanasaku (薔薇ノ木ニ薔薇ノ花咲ク)
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * Cyc Rosé
// * Interchannel & QuinRose
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x880e6fc: mainHandler.bind_(null, 3, "text"),
});

function handler(regs, index, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address
    .readShiftJisString()
    .replace(/^[^\r]+\r\n/, "") // remove name
    .replace(/\r\n\u3000*/gu, "") // single line
    .trim();

  return s;
}
