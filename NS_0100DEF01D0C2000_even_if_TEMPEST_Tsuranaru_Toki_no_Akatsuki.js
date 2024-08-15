// ==UserScript==
// @name         [0100DEF01D0C2000] even if TEMPEST: Tsuranaru Toki no Akatsuki
// @version      1.0.2
// @author       Mansive
// @description  Ryujinx
// * Voltage Inc.
// ==/UserScript==
const gameVer = "1.0.2";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms
const mainHandler2 = trans.send(handler2, "200+");

setHook(
  {
    "1.0.2": {
      // [0x80030e5c - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x80031008 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8002e2cc - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
      [0x80077b28 - 0x80004000]: mainHandler.bind_(null, 0, "story select"),
      // [0x8000d8e8 - 0x80004000]: mainHandler.bind_(null, 0, "clue titles"), // will output everything
      // [0x8000db74 - 0x80004000]: mainHandler2.bind_(null, 0, "clue documents"), // will output everything
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

console.log(`
  Hooks for elements in the clue menu are disabled by default,
  uncomment their lines to enable.
  `);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/\n/g, "") // single line
    .replace(/\\\w+/g, ""); // remove \c0 stuff and \f

  return s;
}

function handler2(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String() + "\n\n"; // clearer separation between each clue page

  return s;
}
