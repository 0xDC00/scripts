// ==UserScript==
// @name         [010095E01581C000] even if TEMPEST: Yoiyami ni Kaku Katariki Majo
// @version      1.0.8, 1.1.1
// @author       Mansive
// @description  Ryujinx
// * Voltage Inc.
// ==/UserScript==
const gameVer = "1.1.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms
const mainHandler2 = trans.send(handler2, "200+");

setHook(
  {
    "1.0.8": {
      // [0x8002ec20 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
      [0x8001cf80 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x800297d0 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
      [0x8000edcc - 0x80004000]: mainHandler.bind_(null, 0, "timed choices"),
      // [0x8006c3a0 - 0x80004000]: mainHandler.bind_(null, 0, "story select"), // can show options not yet unlocked, spoilers
      // [0x8000c61c - 0x80004000]: mainHandler.bind_(null, 0, "clue titles"), // will output everything
      // [0x8005fcc0 - 0x80004000]: mainHandler2.bind_(null, 0, "clue documents"), // will output everything
    },
    "1.1.1": {
      [0x8001dd00 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8002a530 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
      [0x8000f564 - 0x80004000]: mainHandler.bind_(null, 0, "timed choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

// console.log(`
//   Hooks for elements in the clue menu are disabled by default,
//   uncomment their lines to enable.
//   `);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/\n/g, "") // single line
    .replace(/\\\w+/g, ""); // remove \c0 stuff

  return s;
}

function handler2(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String() + "\n\n"; // clearer separation between each clue page

  return s;
}
