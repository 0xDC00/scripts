// ==UserScript==
// @name         [PCSG01180] Tengai ni Mau, Iki na Hana
// @version      1.00
// @author       nanaa
// @description  Vita3k
// Ichi Column
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200++"); // join 200ms

setHook({
  0x8006808e: mainHandler.bind_(null, 0, 0, "dialogue"),
  0x80089408: mainHandler.bind_(null, 0, 0, "choices"),
});

function handler(regs, index, offset, hookname) {
  const address = regs[index].value.add(offset);

  //console.log("onEnter", hookname);
  let s = address.readUtf8String();
  s = s.replace(/\\n/g, ' '); // single line
  s = s.replace(/,.*$/,' '); 

  return s;
}
