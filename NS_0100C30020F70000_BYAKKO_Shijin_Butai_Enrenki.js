// ==UserScript==
// @name         [0100C30020F70000] BYAKKO ~Shijin Butai Enrenki~ (BYAKKO ～四神部隊炎恋記～)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler);

setHook(
  {
    "1.0.0": {
      [0x821ff980 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  const s = address.readUtf8String().replace(/#n\u3000?/g, "");

  return s;
}
