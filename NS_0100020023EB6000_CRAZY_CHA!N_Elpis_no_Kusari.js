// ==UserScript==
// @name         [0100020023EB6000] CRAZY CHA!N -Elpis no Kusari- / CRAZY CHAIN / CRAZY CHA!N -エルピスの鎖-
// @version      1.0.0
// @author       Mansive
// @description  Yuzu
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";
const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler, 600); // pick last from dict scrolling

setHook(
  {
    "1.0.0": {
      // [0x81de2d10 - 0x80004000]: mainHandler.bind_(null, 1, "name"),
      [0x81de2db0 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
      [0x81df5064 - 0x80004000]: dictHandler.bind_(null, 0, "dict popup"),
      [0x81d02308 - 0x80004000]: dictHandler.bind_(null, 0, "dict menu"),
      [0x81d3e3d4 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)],
);

console.log(`
Uncomment the name hook in the script if you want speaker names. 
`)

function handler(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const len = address.add(0x10).readU32();
  let text = address.add(0x14).readUtf16String(len);

  // console.warn(JSON.stringify(text)); // see unmodified sentence

  text = text.replace(/\\\u{3000}?/gu, "\n"); // proper newline
  text = text.replace(/^？？？$/g, ""); // dict unknown entry
  text = text.replace(/"/g, ""); // quotes around dict entry
  text = text.replace(/\$/g, ""); // highlights

  return text;
}

let previous = "";
trans.replace((s) => {
  if (s === previous) {
    console.log("skipped duplicate");
    return null;
  }
  previous = s;

  return s.trim();
});