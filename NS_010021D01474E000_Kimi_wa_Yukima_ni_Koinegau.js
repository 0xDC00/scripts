// ==UserScript==
// @name         [010021D01474E000] Kimi wa Yukima ni Koinegau (君は雪間に希う)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const mainHandler2 = trans.send(handler2, "250+");
const dictHandler = trans.send(handler, -200);

setHook(
  {
    "1.0.0": {
      [0x8013a0f0 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x800319f8 - 0x80004000]: mainHandler2.bind_(null, 0, "soliloquy"), // outputs all at once
      [0x800488e4 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
      [0x800bdb84 - 0x80004000]: dictHandler.bind_(null, 0, "popup"),
      [0x800e4540 - 0x80004000]: dictHandler.bind_(null, 0, "menu"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";
let open = false;

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf32StringLE()
    .replace(/\u3000/gu, "") // remove fullwidth whitespace
    .replace(/\n/g, ""); // single line

  if (s === "――独白――") {
    // 独白 starting, enable other handler
    open = true;
    return null;
  } else if (s === previous) {
    return null;
  } else {
    open = false;
  }
  previous = s;

  return s;
}

function handler2(regs, index, hookname) {
  if (open === false) {
    return null;
  }

  const address = regs[index].value;
  // console.log("onEnter: " + hookname);

  let s = address
    .readUtf32StringLE()
    .replace(/\u3000/gu, "") // remove fullwidth whitespace
    // .replace(/\n/g, "") // single line
    .replace(/#\w.+?\)|#\w+/g, "");

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
