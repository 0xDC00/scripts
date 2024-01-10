// ==UserScript==
// @name         Arcana famiglia -La storia della Arcana Famiglia-
// @version      1.0.0
// @author       [zooo]
// @description  Vita3k
// * HuneX
// * Comfort
// ==/UserScript==

const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+");

setHook({

  0x80070e30: mainHandler.bind_(null, 2, 0, "all"),

});

let pre = "";
function handler(regs, index, offset, hookname) {
  const address = regs[index].value.add(offset);

  console.log("onEnter", hookname);
  console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readShiftJisString();

  if (pre.indexOf(s) !== -1) {
    return null; // skip duplicate (menu, color)
  }

  pre = s;
  s = s.replaceAll(/[\s]/g,'');
  s = s.replace(/@[a-z]/g, ""); 
  s = s.replace(/＄/g, "");

  return s;
}

