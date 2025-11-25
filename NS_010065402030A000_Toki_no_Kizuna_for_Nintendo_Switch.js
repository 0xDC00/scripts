// ==UserScript==
// @name         [010065402030A000] Toki no Kizuna for Nintendo Switch (十鬼の絆 for Nintendo Switch)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Design Factory Co., Ltd.
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

let timer = null;
let topText = "";
let bottomText = "";
let previous = "";

const mainHandler = trans.send(handler, "200+");
const whatHandler = trans.send(handler, -200);

function orderedHandler() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send(topText + "\r\n" + bottomText);
    topText = "";
    bottomText = "";
  }, 500);
}

function topHandler() {
  (topText = handler(...arguments)) && orderedHandler();
}

function bottomHandler() {
  (bottomText = handler(...arguments)) && orderedHandler();
}

setHook(
  {
    "1.0.0": {
      // Toki no Kizuna Sekigahara Kitan (十鬼の絆 関ヶ原奇譚)
      // [0x80164c98 - 0x80004000]: mainHandler.bind_(null, 2, "name & text"),
      [0x801d6a0c - 0x80004000]: mainHandler.bind_(null, 2, "text"),
      [0x801a7b98 - 0x80004000]: mainHandler.bind_(null, 2, "choice"),
      [0x80180320 - 0x80004000]: topHandler.bind_(null, 2, "dict popup word"),
      [0x801803bc - 0x80004000]: bottomHandler.bind_(null, 2, "dict popup meaning"),
      [0x80122360 - 0x80004000]: topHandler.bind_(null, 2, "dict menu word"),
      [0x80122200 - 0x80004000]: bottomHandler.bind_(null, 2, "dict menu meaning"),
      [0x80192960 - 0x80004000]: whatHandler.bind_(null, 0, "what"),

      // Toki no Kizuna Hanayui Tsuzuri (十鬼の絆 花結綴り)
      // [0x80346ee8 - 0x80004000]: mainHandler.bind_(null, 2, "name & text"),
      [0x803ac9dc - 0x80004000]: mainHandler.bind_(null, 2, "text"),
      [0x8037f820 - 0x80004000]: mainHandler.bind_(null, 2, "choice"),
      [0x80360c60 - 0x80004000]: topHandler.bind_(null, 2, "dict popup word"),
      [0x80360cfc - 0x80004000]: bottomHandler.bind_(null, 2, "dict popup meaning"),
      [0x803065b0 - 0x80004000]: topHandler.bind_(null, 2, "dict menu word"),
      [0x80306450 - 0x80004000]: bottomHandler.bind_(null, 2, "dict menu meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  /** @type {NativePointer} */
  const address = regs[1].value;
  let text = address.readUtf32StringLE();
  // console.warn(JSON.stringify(text));

  text = text
    .replace(/#KW/g, "")
    .replace(/\u{FFFD}\P{Script=Cham}*/gu, "")
    .replace(/#\p{Lu}\u{0028}\P{Script=Cham}+?\u{0029}/gu, "")
    .replace(/\n\u{3000}?/gu, ""); // single line

  return text;
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
});
