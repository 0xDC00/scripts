// ==UserScript==
// @name         [0100DAA021616000] Matsurika no Kei -kEi- Tenmei Kashokuden (マツリカの炯-kEi- 天命華燭伝)
// @version      1.0.1
// @author       Mansive
// @description  Yuzu
// * Otomate
// * spec engine (Jakou no Lyla / Birushana Senki)
// ==/UserScript==

const gameVer = "1.0.1";
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "250+"); // join: separator=': ' (250+: +)

setHook(
  {
    "1.0.1": {
      [0x802388dc - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x80245cf8 - 0x80004000]: mainHandler.bind_(null, 1, "choice"),
      [0x801d8dec - 0x80004000]: mainHandler.bind_(null, 0, "dict popup"),
      [0x8015d61c - 0x80004000]: mainHandler.bind_(null, 0, "dict menu"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)],
);

function handler(regs, index, hookname) {
  console.log("onEnter:", hookname);
  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x160 }));

  /* processString */
  let s = address.readUtf32StringLE();
  // console.warn(JSON.stringify(s));

  if (s === "　　") return null;

  s = s.replace(/\n+(\u{3000})?/gu, ""); // single line

  s = s.replaceAll("${FirstName}", "ナーヤ");

  if (s.startsWith("#T")) {
    s = s.replace(/\#T2[^#]+/g, ""); // \#T2[^#]+ || \#T2[^\n]+ (\n=space)
    s = s.replace(/\#T\d/g, "");
  }

  s = s.replace(/�.*/g, "");

  return s;
}
