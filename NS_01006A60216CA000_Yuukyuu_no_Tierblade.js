// ==UserScript==
// @name         [01006A60216CA000] Yuukyuu no Tierblade (悠久のティアブレイド)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
// const junkHandler = trans.send(handler, 200); // broken?

let timer = null;
let topText = "";
let bottomText = "";
let previous = "";

function orderedHandler() {
  clearTimeout(timer);

  timer = setTimeout(() => {
    const result = topText + "\r\n" + bottomText;
    trans.send(result);
    topText = "";
    bottomText = "";
  }, 500);
}

setHook(
  {
    "1.0.0": {
      [0x80053f38 - 0x80004000]: mainHandler.bind_(null, 1, 0x18, "text"),
      [0x8004cdfc - 0x80004000]: mainHandler.bind_(null, 1, 0, "choice"),

      // Lost Chronicle
      [0x80077518 - 0x80004000]: topHandler.bind_(null, 1, 0x18, "LC junk"),
      [0x8005e018 - 0x80004000]: topHandler.bind_(null, 0, 0, "LC dict word"),
      [0x8005e0d4 - 0x80004000]: bottomHandler.bind_(null, 0, 0, "LC dict meaning"),

      // Fragments of Memory
      [0x80036830 - 0x80004000]: mainHandler.bind_(null, 2, 0, "text NVL"),
      [0x8007d584 - 0x80004000]: topHandler.bind_(null, 1, 0x18, "FoM junk"),
      [0x80062824 - 0x80004000]: topHandler.bind_(null, 0, 0, "FoM dict word"),
      [0x800628ec - 0x80004000]: bottomHandler.bind_(null, 0, 0, "FoM dict meaning"),
      [0x800b3a08 - 0x80004000]: mainHandler.bind_(null, 1, 0x24, "frag vertical"),
      [0x800b47cc - 0x80004000]: mainHandler.bind_(null, 1, 0x18, "frag horizontal"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  console.log("onEnter: " + hookname);

  /** @type {NativePointer} */
  const address = regs[index].value;
  // console.log(hexdump(address, { header: true, ansi: true, length: 0x50 }));

  let s = address.add(offset).readUtf8String();
  console.warn(JSON.stringify(s));

  s = s
    .replace(/#n#n/g, "\n") // double newlines? should prob maintain 1 newline
    .replace(/\s*(#n)+\s*/g, "") // single line
    .replace(/#\w+(\[.+?\])?/g, ""); // what was this for again

  return s;
}

function topHandler() {
  (topText = handler(...arguments)) && orderedHandler();
}

function bottomHandler() {
  (bottomText = handler(...arguments)) && orderedHandler();
}

trans.replace((s) => {
  return s !== previous ? ((previous = s), s.trim()) : null;
});
