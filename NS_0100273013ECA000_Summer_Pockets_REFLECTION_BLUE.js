// ==UserScript==
// @name         [0100273013ECA000] Summer Pockets REFLECTION BLUE
// @version      1.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Key
// * PROTOTYPE
// * SiglusEngine
// ==/UserScript==
const gameVer = "1.0.0";

const { setHook } = require("./libYuzu.js");

const texts = new Set();
let timer = null;
let open = true;
let delayed = false;
let inMenu = false;
let isRecord = false;
let recordPassed = false;
let previous = "";
let previousImmediate = "";

setHook(
  {
    "1.0.0": {
      [0x8007a878 - 0x80004000]: omniHandler.bind_(null, 1, 0x1b, "text"), // reminiscent of the tragedy of Taishou x Alice
      [0x80173dd4 - 0x80004000]: menuHandler.bind_(null, 0, 0x1b, "save/load file title"),
      // [0x8000b0a4 - 0x80004000]: menuHandler.bind_(null, 0, 0x1b, "save/load file text"), // blows up android
      [0x8000b0b0 - 0x80004000]: menuHandler.bind_(null, 0, 0x1b, "save/load file text"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

function bracketsMatch(text) {
  return (text.at(0) === "「" && text.at(-1) === "」") || (text.at(0) === "『" && text.at(-1) === "』") || (text.at(0) === "（" && text.at(-1) === "）");
}

function resetOpenTimer() {
  open = false;

  clearTimeout(timer);
  timer = setTimeout(() => {
    open = true;
    texts.clear();
  }, 200);
}

function omniHandler(regs, index, offset, hookname) {
  if (open === false) {
    resetOpenTimer();
    return null;
  }

  const address = regs[index].value;

  // console.log("onEnter: " + hookname);
  // console.log(hexdump(address.add(offset), { header: false, ansi: false, length: 0x50 }));

  let s = address.readUtf16String();

  if (s === previous) {
    return null;
  }
  previous = s;

  if (s === "レコードを獲得しました！") {
    isRecord = true;
    return null;
  } else if (isRecord === true && recordPassed === false) {
    recordPassed = true;
  } else if (isRecord === true && recordPassed === true) {
    return null;
  } else {
    isRecord = false;
    recordPassed = false;
  }

  let isDialogue = false;
  if (s.length > (s = s.replace(/^[^@]+@/, "")).length) {
    isDialogue = true;
  }

  // filter some stuff
  if ((s = s.replace(/\$\[(\P{Script=Cham}+)\u{0024}[^\]]+\]/gu, "$1")) === "＿") {
    resetOpenTimer();
    return null;
  }

  if (delayed === true) {
    s = (previousImmediate + s).trim();
    if (bracketsMatch(s) === true) {
      delayed = false;
    }
  }
  previousImmediate = s;

  if (isDialogue === true && bracketsMatch(s) === false) {
    delayed = true;
  }

  texts.add(s.replace(/\$[\p{Alphabetic}\p{Script=Cham}\p{N}]+/gu, ""));

  clearTimeout(timer);
  timer = setTimeout(() => {
    if (inMenu === false) {
      previous = s;
    } else {
      inMenu = false;
    }

    // console.log("onEnter: " + hookname);

    trans.send([...texts].join("\r\n"));
    texts.clear();
  }, 200);

  return s;
}

function menuHandler() {
  inMenu = true;
  resetOpenTimer();
}
