// ==UserScript==
// @name         [ULJM05795] Togainu no Chi (咎狗の血)
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * NITRO CHiRAL
// * Kadokawa Shoten & NITRO PLUS
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");
const choiceHandler = trans.send(handler2, "200+");

setHook({
  0x8863f60: mainHandler.bind_(null, 0, "text"),
  0x8863928: choiceHandler.bind_(null, 1, "choice"),
});

console.log(`
  If your screen flickers red, disable "Skip buffer effects" in PPSSPP.
  `);

let previous = "";

function handler(regs, index, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString();

  if (s === previous) {
    return null;
  }
  previous = s;

  s = s
    .replace(/^\u3000/gu, "") // remove fullwidth whitespace in beginning
    .replace(/\^\u3000/gu, "") // remove line continuation markers
    .replace(/<([^>]+),[^>]+>/g, "$1"); // "<枷,かせ>" -> "枷"

  return s;
}

function handler2(regs, index, hookname) {
  // console.log("onEnter:", hookname);

  const address = regs[index].value;
  const s = address.readShiftJisString();

  if (s.startsWith("_SELR")) {
    console.log("attempt:", hookname);

    let result = "";

    // try extracting choices; maximum of 4 choices?
    for (const thing of s.split(";", 4)) {
      if (thing.startsWith("_SELR")) {
        result += thing.slice(8, -1) + "\r\n";
      }
    }

    return result;
  } else {
    return null;
  }
}

trans.replace((s) => {
  return s.trimEnd();
});
