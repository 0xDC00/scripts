// ==UserScript==
// @name         [0100E9801CAC2000] OVER REQUIEMZ
// @version      1.0.1
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Otomate
// * Kogado Girls Project
// ==/UserScript==
const gameVer = "1.0.1";

const { setHook } = require("./libYuzu.js");

const ENABLE_NAME_HOOK = true;

const mainHandler = trans.send(handler1, "200+");
const choiceHandler = trans.send(handler2, "200+");

setHook(
  {
    "1.0.1": {
      [0x8299e754 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8299f9b0 - 0x80004000]: choiceHandler.bind_(null, 0, "choice"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

console.log(`
To disable names, set ENABLE_NAME_HOOK in script to false.  
`);

function handler1(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const array = [ENABLE_NAME_HOOK && regs[20], regs[23], regs[22], regs[21]];
  const s = array
    .map((reg) => readString(reg.value))
    .join("")
    .replace(/\u{003C}\P{Script=Cham}+?\u{003E}/gu, "");

  return s;
}

function handler2(regs, index, hookname) {
  console.log("onEnter: " + hookname);

  const address = regs[index].value;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = readString(address).replace(
    /\u{003C}\P{Script=Cham}+?\u{003E}/gu,
    "\n"
  );

  return s;
}

function readString(address) {
  const len = address?.add(0x10).readU32();
  if (len === 0 || len === undefined) {
    return "";
  }
  const s = address.add(0x14).readUtf16String(len);

  return s;
}
