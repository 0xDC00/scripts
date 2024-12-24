// ==UserScript==
// @name         [ULJM06301] Toki no Kizuna Hanayuitsuzuri (十鬼の絆 花結綴り)
// @version      0.1
// @author       Mansive
// @description  PPSSPP x64
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, "200+");
const omniHandler = trans.send(handler2, -400);

setHook({
  0x885e438: mainHandler.bind_(null, 0, 0, "name"),
  0x88cc9b8: mainHandler.bind_(null, 0, 20, "text"),
  0x88f878c: mainHandler.bind_(null, 0, 0, "choice"),
  // 0x89e54f8: omniHandler.bind_(null, 0, 0, "everything"),
});

console.log(`
  To hook dictionary entries, uncomment the "everything" hook in the script.
  Note that it will also hook many other text elements.
  If you do uncomment it, you should comment out the "text" and "name" hooks.
  `);

let previous = "";

function handler(regs, index, offset, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.add(offset).readShiftJisString();

  if (s === "") {
    return null;
  }

  s = s.replace(/#\w+\[.+?\]/g, ""); // remove stuff

  return s;
}

function handler2(regs, index, offset, hookname) {
  console.log("onEnter:", hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.add(offset).readShiftJisString();

  s = s
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

  return s;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  s = s.replace(/#n\u3000?/gu, ""); // single line

  return s;
});
