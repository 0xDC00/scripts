// ==UserScript==
// @name         [0100F7E00DFC8000] Cupid Parasite (キューピット・パラサイト)
// @version      1.0.1
// @author       [zooo], Mansive
// @description  Yuzu
// * Otomate
// ==/UserScript==

const gameVer = "1.0.1";
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook(
  {
    "1.0.1": {
      // [0x80057910 - 0x80004000]: mainHandler.bind_(null, 2, "name + text"),
      [0x80064684 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x800640d8 - 0x80004000]: mainHandler.bind_(null, 0, "text monologue"),
      [0x800646e0 - 0x80004000]: mainHandler.bind_(null, 1, "text dialogue"),
      [0x80169df0 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  /* processString */
  let s = address.readUtf32StringLE();

  // s = s.replaceAll(/[\s]/g, "");
  s = s.replace(/\n\u3000?/g, ""); // single line without fullwidth whitespace
  s = s.replaceAll("#KW", "");
  s = s.replaceAll("#C(TR,0xff0000ff)", "");
  s = s.replace(/#P\(.*\)/g, "");
  s = s.trim();

  return s;
}
