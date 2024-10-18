// ==UserScript==
// @name         [0100A1E00BFEA000] AMNESIA for Nintendo Switch
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu, Ryujinx
// * Idea Factory (アイディアファクトリー)
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook(
  {
    "1.0.0": {
      [0x805bba5c - 0x80004000]: mainHandler.bind_(null, 2, "dialogue"),
      [0x805e9930 - 0x80004000]: mainHandler.bind_(null, 1, "choice"),
      [0x805e7fd8 - 0x80004000]: mainHandler.bind_(null, 1, "name"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const reg = regs[index];

  // console.log("onEnter: " + hookname);
  const address = reg.value;
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  /* processString */
  const len = address.add(0x10).readU16() * 2;
  let s = address.add(0x14).readUtf16String(len);
  s = s.replace(/\\n/g, "");
  s = s.replace(/(.+? ")/g, "");
  s = s.replace(/(",.*)/g, "");
  s = s.replace(/(" .*)/g, "");

  return s;
}
