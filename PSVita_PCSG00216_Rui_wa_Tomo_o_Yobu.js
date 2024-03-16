// ==UserScript==
// @name         [PCSG00216]  Rui wa Tomo o Yobu
// @version      0.1
// @author       GO123 (Also Big thanks to Koukdw )
// @description  Vita3k
// *Akatsuki WORKS & MAGES. GAME
// ==/UserScript==

//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, 200); // join 200ms

setHook({
  0x81003db0: mainHandler.bind_(null, 1, "dialogue"),
});
let pre = '';
function handler(regs, index, hookname) {
  const address = regs[index].value; // x1

  //console.log('onEnter' + hookname);
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf8String();

  if (pre.indexOf(s) !== -1) {
    return null; // skip duplicate (menu, color)
  }

  pre = s;
  s = s.replace(/\\n/g, ' '); // single line

  return s;
}
trans.replace(function (s) {
  pre = '';
  // print rubi: と[けい]痙[れん]攣
  const patt = /\[[^\]]+./g;
  const rubis = s.matchAll(patt);
  for (const rubi of rubis) {
    const ruby = rubi[0];
    const n = parseInt(ruby.match(/\d+\]$/) ?? 0) + 1;
    let q = ruby.indexOf(',');
    q = q !== -1 ? q : ruby.length - 2;
    // console.log('rubi: ' + ruby.substr(1, q));
    //  console.log('rube: ' + s.substr(rubi.index + ruby.length, n));
  }

  // remove rubi
  s = s.replace(patt, '');

  // remove control: %p-1;――
  s = s.replace(/\\k|\\x|%C|%B|#ffffffff|%d0|%p-1;/g, '');

  // color, remove end tag (pre)
  // #0084ff;color1%r default text #0084ff;color2%r #0084ff;color 3
  // color1
  s = s.replace(/\#[0-9a-fA-F]+\;([^%#]+)(%r)?/g, '$1');
  return s;
}); 
