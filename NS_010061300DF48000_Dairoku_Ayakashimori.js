// ==UserScript==
// @name         [010061300DF48000] Dairoku: Ayakashimori (DAIROKU：AYAKASHIMORI)
// @version      1.0.1
// @author       Mansive
// @description  Ryujinx
// * Otomate & Regista
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "250++");
const choiceHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler2, "200+");

setHook(
  {
    "1.0.1": {
      [0x800e35ec - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x800d103c - 0x80004000]: choiceHandler.bind_(null, 0, "choices"),
      [0x800f1320 - 0x80004000]: dictHandler.bind_(null, 0, "dictionary"), // x0 - word, x1 - meaning
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .readUtf8String()
    .replace(/%\w+/g, "")
    .replace(/\u3000/gu, ""); // remove fullwidth whitespace

  return s;
}

let previousWord = "";
let previousMeaning = "";

function handler2(regs, index, hookname) {
  const address1 = regs[0].value;
  let address2 = regs[1].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let word = address1.readUtf8String().replace(/\w+\.\w+/g, "");

  // unknown number of nulls?
  do {
    address2 = address2.add(1);
  } while (address2.readU8() === 0);

  let meaning = address2.readUtf8String().replace(/%\w+/g, "");

  if (word === previousWord || meaning === previousMeaning) {
    return null;
  }
  previousWord = word;
  previousMeaning = meaning;

  return word + "\n" + meaning;
}
