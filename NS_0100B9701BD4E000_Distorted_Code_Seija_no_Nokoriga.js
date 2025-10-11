// ==UserScript==
// @name         [0100B9701BD4E000] Distorted_Code_Seija_no_Nokoriga

// @version      1.0.1
// @author       GO123
// @description  Citron
// * TAKUYO
// *
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200++");

setHook(
  {
    "1.0.1": {
      [0x80011a30 - 0x80004000]: mainHandler.bind_(null, 0, "text"),

    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);



function handler(regs, index, hookname) {
  const reg = regs[index];

  //console.log('onEnter: ' + hookname);
  const address = reg.value;
  /* processString */
  const s = address.readShiftJisString()
    .replace(/(\\n)+/g, ' ')
    .replace(/\\d$|^\@[a-z]+|#.*?#|\\u|\$/g, '') // #.*?# <=> #[^#]+.

    ;
  return s;
}
