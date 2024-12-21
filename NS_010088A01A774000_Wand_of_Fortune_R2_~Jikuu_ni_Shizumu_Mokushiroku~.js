// ==UserScript==
// @name         [010088A01A774000] ワンド オブ フォーチュン Ｒ２ ～時空に沈む黙示録～ for Nintendo Switch
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// ==/UserScript==
trans.replace(function (s) {
  return s.replace(/<param==Name>/g, "ルル");
});
//------------------------------------------------
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook(
  {
    "1.0.0": {
      [0x821540c4 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
      [0x8353e674 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x835015e8 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x823ff004 - 0x80004000]: mainHandler.bind_(null, 0, "dictionary"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  /* processString */
  const len = address.add(0x10).readU16() * 2;
  let s = address.add(0x14).readUtf16String(len);
  s = s.replaceAll(/[\s]/g, "");
  s = s.replace(/<[^>]+>/g, "");

  return s;
}
