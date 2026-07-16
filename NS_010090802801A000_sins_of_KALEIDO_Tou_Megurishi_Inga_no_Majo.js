// ==UserScript==
// @name         [010090802801A000] sins of KALEIDO: Tou Megurishi Inga no Majo / sins of KALEIDO 塔巡りし因果の魔女
// @version      1.0.0
// @author       Mansive
// @description  Yuzu
// * AmuLit
// * Voltage Inc.
// ==/UserScript==
const gameVer = "1.0.0";
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const diaryHandler = trans.send(handler, "200+\n\n\n\n+");

setHook(
  {
    "1.0.0": {
      // [0x822fe070 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x822b29b0 - 0x80004000]: mainHandler.bind_(null, 2, "dialogue"),
      [0x82193cc8 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x81f9833c - 0x80004000]: diaryHandler.bind_(null, 0, "diary left"),
      [0x81f98430 - 0x80004000]: diaryHandler.bind_(null, 0, "diary right"),
      [0x81f8e9d0 - 0x80004000]: mainHandler.bind_(null, 0, "flowchart"),
      [0x81d0eba4 - 0x80004000]: mainHandler.bind_(null, 0, "chapter title"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)],
);

console.log(`
  Uncomment the name hook in the script if you want speaker names in the output.
`)

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const len = address.add(0x10).readU32();

  if (len === 0) {
    // no name, don't bother processing
    return;
  }

  let text = address.add(0x14).readUtf16String(len);

  // console.warn(JSON.stringify(text)); // see unmodified sentence

  text = text.replace(/\n\u{3000}*/gu, "\n"); // strip indents from newline
  text = text.replace(/？？？/g, ""); // filter empty diary

  return text.trim();
}