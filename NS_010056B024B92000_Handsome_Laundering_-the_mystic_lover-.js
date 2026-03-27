// ==UserScript==
// @name         [010056B024B92000] Handsome Laundering -the mystic lover- (ハンサムロンダリング -the mystic lover-)
// @version      1.0.0, 1.1.0
// @author       Mansive
// @description
// * MintLip & Edia Co., Ltd.
// * Edia Co., Ltd.
// *
// ==/UserScript==
const gameVer = "1.1.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook(
  {
    "1.0.0": {
      [0x8348cc98 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x83490218 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x817f4c4c - 0x80004000]: mainHandler.bind_(null, 0, "dict word"),
      [0x817f4ca0 - 0x80004000]: mainHandler.bind_(null, 0, "dict meaning"),
      [0x817c8818 - 0x80004000]: mainHandler.bind_(null, 0, "character select"),
    },
    "1.1.0": {
      [0x8348ccd8 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x83490258 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x817f4c8c - 0x80004000]: mainHandler.bind_(null, 0, "dict word"),
      // [0x817f4e20 - 0x80004000]: mainHandler.bind_(null, 0, "dict meaning"), // false
      [0x817f4ce0 - 0x80004000]: mainHandler.bind_(null, 0, "dict meaning"),
      [0x817c8858 - 0x80004000]: mainHandler.bind_(null, 0, "character select"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)],
);

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
  // console.warn(JSON.stringify(address.add(0x14).readUtf16String()));

  const s = address
    .add(0x14)
    .readUtf16String()
    .replace(/\\n(\u{3000})?/gu, "\n") // add newlines
    // .replace(/\\n(\u{3000})?/gu, "") // remove newlines
    .replace(/<[^>]+>/g, "");

  return s;
}
