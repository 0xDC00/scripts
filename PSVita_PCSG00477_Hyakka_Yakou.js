// ==UserScript==
// @name         [PCSG00477] Hyakka Yakou (百華夜光)
// @version      1.00
// @author       Mansive
// @description  Vita3K
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");
const popupHandler = trans.send(handler2, "200+");

setHook({
  0x80032b30: mainHandler.bind_(null, 8, "text"),
  // 0x8001ab38: mainHandler.bind_(null, 6, "name"),
  0x80019c5a: mainHandler.bind_(null, 5, "choice"),
  0x80031a46: mainHandler.bind_(null, 6, "choice oiran"),
  0x8003a49a: popupHandler.bind_(null, 0, "popup open"), // AdvUiPopup
  // 0x8018229c: popupHandler.bind_(null, 4, "popup word"), // redundant?
  0x80182532: popupHandler.bind_(null, 7, "popup meaning"),
  0x8017d1da: mainHandler.bind_(null, 5, "menu word"),
  0x8017d478: mainHandler.bind_(null, 4, "menu meaning"),
  0x8017a6aa: mainHandler.bind_(null, 6, "favorability"),
});

let previous = "";
let meaning = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString();

  return s;
}

function handler2(regs, index, hookname) {
  if (hookname === "popup open") {
    if (meaning === previous) {
      return null;
    }
    previous = meaning;

    return meaning;
  }

  const address = regs[index].value;
  meaning = address.readShiftJisString();
}

trans.replace((s) => {
  return s
    .replace(/#n\u3000*/gu, "") // remove newline and trailing fullwidth whitespace
    .replace(/#\w.+?]/g, ""); // remove controls
});
