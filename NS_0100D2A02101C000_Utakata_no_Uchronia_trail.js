// ==UserScript==
// @name         [0100D2A02101C000] Utakata no Uchronia -trail-
// @version      1.0.0
// @author       Mansive (regex from emilybrooks)
// @description  Yuzu, Ryujinx
// * LicoBiTs
// * Broccoli
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");
const mainHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.0": {
      [0x818f2490 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x81a47ac8 - 0x80004000]: mainHandler.bind_(null, 0, "dictionary"),
      [0x81832720 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const playerName = "雛菊";
console.log(`
If you're using a non-default player name,
you can change the playerName variable in the script so that the script will accurately output your name.

Current playerName: ${playerName}
`);

function handler(regs, index, name) {
  const address = regs[index].value;
  const len = address.add(0x10).readU16();
  let text = address.add(0x14).readUtf16String(len);
  text = text.replace(/\n\u{3000}?/gu, ""); // single line
  text = text.replace(/\[主人公\]/g, playerName); // placeholder name
  text = text.replace(/\[dic.*?text=/g, ""); // dictionary words
  text = text.replace(/\[|'.*?\]/g, ""); // ruby text
  text = text.replace(/\]/g, ""); // closing brace if no ruby text
  return text;
}
