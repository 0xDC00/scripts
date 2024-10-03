// ==UserScript==
// @name         [01000BB01CB8A000] Trouble Magia ~Wakeari Shoujo wa Mirai o Kachitoru Tame ni Ikoku no Mahou Gakkou e Ryuugaku Shimasu~ (トラブル・マギア ～訳アリ少女は未来を勝ち取るために異国の魔法学校へ留学します～)
// @version      1.0.0
// @author       Mansive
// @description  Sudachi, Ryujinx
// * Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler); // instant, clearer separation between each entry
// const dictHandler = trans.send(handler, -400); // less spam when scrolling through list

setHook(
  {
    "1.0.0": {
      [0x8017e6b0 - 0x80004000]: mainHandler.bind_(null, 1, "text"),
      [0x80177ae0 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
      [0x80122a4c - 0x80004000]: mainHandler.bind_(null, 0, "dict popup"),
      [0x800ba088 - 0x80004000]: dictHandler.bind_(null, 0, "dict menu"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const decoder = new TextDecoder("utf-16");
let previous = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = readString(address, hookname);

  if (s === previous) {
    return null;
  }
  previous = s;

  s = s.replace(/\u3000/gu, "");

  return s;
}

function readString(address, hookname) {
  const buf = new Uint16Array(2);
  let s = "";
  let c = null;

  while ((c = address.readU16())) {
    if (c == 0x0 || c == 0xcccc) {
      // stop when we hit a null or some weird character
      break;
    } else if (c == 0xa || c == 0xd) {
      // skip newlines and carriage returns
    } else {
      buf[0] = c;
      buf[1] = address.add(1).readU16();
      s += decoder.decode(buf)[0];
    }

    address = address.add(4);
  }

  return s;
}
