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
  0x880e6fc: mainHandler.bind_(null, 3, "name"),
  0x880be70: mainHandler.bind_(null, 3, "text"),
});

function handler(regs, index, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString().replace(/\n/g, "");

  if (hookname === "name") {
    return s.replace(/\r.*/g, "");
  } else if (hookname === "text") {
    return s.replace(/^[^\r]+\r/, "").replace(/\r\u3000*/gu, ""); // single line
  }

  return s;
}

trans.replace((s) => {
  return s.trim();
});
