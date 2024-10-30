// ==UserScript==
// @name         [0100F9D00C186000] Olympia Soiree (オランピアソワレ)
// @version      1.0.0
// @author       [Owlie], Mansive
// @description  Yuzu, Ryujinx
// * HYDE, Inc. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200++");
const choiceHandler = trans.send(handler, "200+");
const popupDictHandler = trans.send(handler2, "200");
const menuDictHandler = trans.send(handler3, "200");

setHook(
  {
    "1.0.0": {
      [0x8002ad60 - 0x80004000]: mainHandler.bind_(null, 31, "text"), // good
      [0x8004b9e0 - 0x80004000]: choiceHandler.bind_(null, 1, "choice"),
      [0x800add34 - 0x80004000]: popupDictHandler.bind_(null, 1, "popup dict"),
      [0x80059460 - 0x80004000]: menuDictHandler.bind_(null, 0, "menu dict"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const RE =
  /[\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}！-～\u3000-\u303f]/u;
let previous = "";
let isChoice = false;

function handler(regs, index, hookname) {
  isChoice = hookname === "choice" ? true : false;

  const address = regs[index].value;
  // console.log("onEnter: ", hookname);
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const s = address.readUtf8String();

  if (s === "") {
    return null;
  }

  return s;
}

function handler2(regs, index, hookname) {
  if (isChoice === true) {
    return null;
  }

  const address = regs[index].value;
  let temp = address;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  // unknown number of null characters?
  // currently at nulls; go backwards to find start of popup dictionary word
  do {
    temp = temp.add(-1);
  } while (temp.readU8() !== 0);
  temp = temp.add(1); // at null; go forwards slightly
  const word = temp.readUtf8String();

  temp = address; // reset temp to original address

  // currently at nulls; go forwards to find meaning for the word
  while (temp.readU8() === 0) {
    temp = temp.add(1);
  }
  const meaning = temp.readUtf8String();

  const s = word + "\n" + meaning;

  if (
    word === "はい" ||
    word === "いいえ" ||
    s === previous ||
    s.search(RE) === -1
  ) {
    return null;
  }
  previous = s;

  return s;
}

function handler3(regs, index, hookname) {
  const address = regs[index].value;
  let temp = address;
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

  const word = temp.readUtf8String();

  // currently at word; find next null character
  while (temp.readU8() !== 0) {
    temp = temp.add(1);
  }

  // currently at nulls; go forwards to find meaning
  while (temp.readU8() === 0) {
    temp = temp.add(1);
  }
  const meaning = temp.readUtf8String();

  const s = word + "\n" + meaning;

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}

trans.replace((s) => {
  return s
    .replace(/(#Ruby\[)([^,]+).([^\]]+)./g, "$2")
    .replace(/#Color\[[\d]+\]/g, "")
    .replace(/#n/g, "")
    .replace(/\u3000/gu, ""); // remove fullwidth whitespace
});
