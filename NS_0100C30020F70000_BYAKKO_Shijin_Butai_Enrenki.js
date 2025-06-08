// ==UserScript==
// @name         [0100C30020F70000] BYAKKO ~Shijin Butai Enrenki~ (BYAKKO ～四神部隊炎恋記～)
// @version      1.0.0
// @author       Mansive
// @description  Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

let timer = null;
let topText = "";
let bottomText = "";
let previous = "";

const mainHandler = trans.send(handler, "200+");

function orderedHandler() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send(topText + "\r\n" + bottomText);
    topText = "";
    bottomText = "";
  }, 500);
}

//prettier-ignore
setHook(
  {
    "1.0.0": {
      "H5c40a2d473e706d0": mainHandler.bind_(null, 0, 0x5e, "text"),
      "H43e2e446a6cec981": mainHandler.bind_(null, 1, 0, "choices"),
      "Hafe13686e934c977": topHandler.bind_(null, 0, 0, "dict word"),
      "H6fcd859aa0cb4d8c": bottomHandler.bind_(null, 0, 0, "dict meaning"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, offset, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  const text = address.add(offset).readUtf8String();

  return text;
}

function topHandler() {
  (topText = handler(...arguments)) && orderedHandler();
}

function bottomHandler() {
  (bottomText = handler(...arguments)) && orderedHandler();
}

trans.replace((s) => {
  return s !== previous ? ((previous = s), s.replace(/#n\u3000?/g, "")) : null;
});
