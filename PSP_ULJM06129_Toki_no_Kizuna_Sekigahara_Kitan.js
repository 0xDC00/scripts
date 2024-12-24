// ==UserScript==
// @name         [ULJM06129] Toki no Kizuna Sekigahara Kitan (十鬼の絆 関ヶ原奇譚)
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler2, -400);

setHook({
  0x885e25c: mainHandler.bind_(null, 0, 0, "name"),
  0x88ccd9c: mainHandler.bind_(null, 0, 20, "text"),
  0x88b49f4: dictHandler.bind_(null, 0, 0, "dict popup"),
  // 0x88cd568: mainHandler.bind_(null, 0, 20, "everything"),
});

console.log(`
  To hook choices and dictionary menu entries,
  uncomment the "everything" hook in the script.
  Note that it might output messy text.
  `);

let previous = "";
let currentText = "";
let characterName = "";
let dictText = "";

function cleanup(text) {
  return text
    .replace(/#Scale.+?#Scale\[.+?\]/, "") // remove furigana/reading
    .replace(/#Pos.+?#Scale\[.+?\]/, "\n") // convert heading into newline
    .replace(/Χ/g, "、")
    .replace(/Δ/g, "。")
    .replace(/Λ/g, "っ")
    .replace(/∫|\u0391/gu, "「")
    .replace(/∨|\u0392/gu, "」")
    .replace(/П|\u0399/gu, "【")
    .replace(/Ц|\u039A/gu, "】")
    .replace(/#?\w.+?\]|^.+?]|^\u3000/g, ""); // deal with other garbage
}

function handler(regs, index, offset, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.add(offset).readShiftJisString();

  if (s === "") {
    return null;
  }

  s = s.replace(/#\w+\[.+?\]/g, ""); // remove stuff

  if (hookname === "text") {
    currentText = s;
    dictText = "";
  }

  if (hookname === "name") {
    characterName = s;
  }

  if (hookname === "dict popup") {
    dictText = s;
  }

  if (hookname === "everything") {
    if (
      s === characterName ||
      s === currentText ||
      (dictText !== "" && s.includes(dictText) === true)
    ) {
      return null;
    }

    s = cleanup(s);
  }

  return s;
}

function handler2(regs, index, offset, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  let s = address.add(offset).readShiftJisString();

  s = cleanup(s);

  return s;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  s = s
    .replace(/#n\u3000?/gu, "") // single line
    .replace(/\s{3,}/gu, "\n") // stuff with multiple spaces are prob newlines
    .trim();

  return s;
});
