// ==UserScript==
// @name         [ULJM05701] Hanakisou (花帰葬)
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * HaccaWorks*
// * PROTOTYPE
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");

setHook({
  0x88139f4: mainHandler.bind_(null, 0, "text"),
});

console.log(`
  If PPSSPP flickers, disable "Skip buffer effects".
  `);

let previous = "";

function handler(regs, index, hookname) {
  // console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf16String();

  if (s === previous) {
    return null;
  }
  previous = s;

  s = s
    .replace(/^\u3010[^\u3011]+\u3011/gu, "") // remove name
    .replace(/\n\u3000+/g, ""); // single line without fullwidth whitespace padding

  return s;
}
