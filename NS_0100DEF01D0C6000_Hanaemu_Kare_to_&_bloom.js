// ==UserScript==
// @name         [0100DEF01D0C6000] Hanaemu Kare to & bloom (花笑む彼と & bloom)
// @version      1.0.0
// @author       Mansive
// @description  Yuzu / Ryujinx
// * MintLip
// * Edia
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200+");
const dictHandler1 = trans.send(handler2, "200+");
const dictHandler2 = trans.send(handler3, "200+");

setHook(
  {
    "1.0.0": {
      [0x833e4d84 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
      [0x8335f650 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
      [0x81729520 - 0x80004000]: dictHandler1.bind_(null, 1, "selection"), // selected entry
      [0x83375938 - 0x80004000]: dictHandler2.bind_(null, 0, "dictionary"), // x1 - word, x2 - meaning
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const dict = new Map(); // Flower Book

function handler(regs, index, hookname) {
  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  let s = address
    .add(0x14)
    .readUtf16String()
    .replace(/\n/g, "") // single line
    .replace(/\u3000/gu, "") // remove fullwidth whitespace
    .replace(/<.+?>/g, "");

  if (s === "") {
    return null;
  }

  return s;
}

let previous = "";

function handler2(regs, index, hookname) {
  const address = regs[index].value;

  const word = address.add(0x14).readUtf16String();
  const meaning = dict.get(word);

  if (word === previous || meaning === undefined) {
    return null;
  }
  previous = word;

  return word + "\n" + meaning;
}

function handler3(regs, index, hookname) {
  // this handler will output every dictionary entry if left unchecked
  // instead, put every entry into map
  // if player selects an entry, selection handler will fetch it from map

  // avoid repopulating map
  if (dict.size === 70) {
    return null;
  }

  const address1 = regs[1].value;
  const address2 = regs[2].value;

  const word = address1.add(0x14).readUtf16String();
  const meaning = address2.add(0x14).readUtf16String();

  dict.set(word, meaning);
}
