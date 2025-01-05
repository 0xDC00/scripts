// ==UserScript==
// @name         [01002BE0118AE000] OZMAFIA!! -vivace-
// @version      1.0.1
// @author       Mansive
// @description  Yuzu/Sudachi, Ryujinx
// * Poni-Pachet
// * Dramatic Create
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const choiceHandler = trans.send(handler2, "200+");

setHook(
  {
    "1.0.1": {
      [0x80058544 - 0x80004000]: mainHandler.bind_(null, 1, "text"),
      [0x8005b1f4 - 0x80004000]: choiceHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let previous = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.readShiftJisString().replace(/\u{005E}/gu, "");

  return s;
}

function handler2(regs, index, hookname) {
  const address = regs[index].value;
  const s = address.readShiftJisString();

  // similar to togainu no chi
  if (s.startsWith("_SELZ") === true) {
    console.log("attempt: " + hookname);
    return s.split(");", 1).at(0).split(",").slice(2).join("\r\n");
  }
}

trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
});
