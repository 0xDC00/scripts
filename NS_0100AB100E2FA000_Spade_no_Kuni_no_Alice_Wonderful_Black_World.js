// ==UserScript==
// @name         [0100AB100E2FA000] Spade no Kuni no Alice ~Wonderful Black World~ (スペードの国のアリス ～Wonderful Black World～)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu / Ryujinx
// * QuinRose reborn
// * Idea Factory Co., Ltd. & Otomate
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler = trans.send(handler2, "200+");

setHook(
  {
    "1.0.0": {
      [0x819dbdc8 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x81f8e564 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
      [0x816a1e08 - 0x80004000]: dictHandler.bind_(null, 1, "dictionary"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const decoder = new TextDecoder("utf-16");
let previous = "";

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(0x14)
    .readUtf16String()
    .replace(/\n/gu, "") // single line
    .replace(/\u3000/gu, "") // remove fullwidth whitespace
    .replace(/<[^>]*>/g, ""); // remove html tags
  return s;
}

function handler2(regs, index, hookname) {
  // handles dictionary entries that have weird byte sequence

  let address = regs[index].value;

  console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const buf = new Uint16Array(2);
  let s = "";
  let c = null;

  address = address.add(0x20);
  while ((c = address.readU16())) {
    if (c == 0x0) {
      break;
    } else if (c == 0xa) {
      // skip newline
    } else {
      buf[0] = c;
      buf[1] = address.add(1).readU16();
      s += decoder.decode(buf)[0];
    }
    address = address.add(12);
  }

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
