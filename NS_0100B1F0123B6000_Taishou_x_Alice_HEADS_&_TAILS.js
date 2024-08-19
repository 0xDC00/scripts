// ==UserScript==
// @name         [0100B1F0123B6000] Taishou x Alice: HEADS & TAILS
// @version      2.0.0
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Primula & PROTOTYPE & JAST USA & PRODUCTION PENCIL
// ==/UserScript==
const gameVer = "2.0.0";

const { setHook } = require("./libYuzu.js");

const mainHandler = handler;
const mainHandler2 = handler2;

setHook(
  {
    "2.0.0": {
      [0x8009bb3c - 0x80004000]: mainHandler.bind_(null, 1, "text"), // dialogue, choices
      [0x8009bc58 - 0x80004000]: mainHandler2.bind_(null, 1, "delayed text"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const RE =
  /[\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}！-～\u3000-\u303f]/u;
const texts = [];
let timer = null;
let open = true;
let delayed = false;
let previous = "";

function resetOpenTimer() {
  open = false;

  clearTimeout(timer);
  timer = setTimeout(() => {
    open = true;
    texts.length = 0;
  }, 200);
}

function handler(regs, index, hookname) {
  if (open === false) {
    resetOpenTimer();
    return null;
  }
  const address = regs[index].value;
  // console.log("onEnter: ", hookname);

  let s = getText(address);

  if (s === null) {
    return null;
  }

  // ignore text from save/load menus; prevent backlog spam
  if (s.at(0) === "【" || s === "＿" || (s === previous && delayed === false)) {
    resetOpenTimer();
    return null;
  }

  // missing closing bracket means it's probably dialogue with delayed text
  if (s.at(0).search(/[「『（]/) === 0 && s.at(-1).search(/[」』）]/) === -1) {
    delayed = true;
  }

  previous = s;
  texts.push(s);

  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send(texts.join("\r\n")); // joins choices
    texts.length = 0;
  }, 200);
}

function handler2(regs, index, hookname) {
  if (open === false) {
    resetOpenTimer();
    return null;
  }

  delayed = false;
  const address = regs[index].value;
  // console.log("onEnter: ", hookname);

  let s = getText(address);

  if (s === null) {
    return null;
  }

  const result = (texts.pop() + s).trim(); // concatenate with earlier unfinished line
  texts.push(result); // this will get output by main handler later
}

function getText(address) {
  let s = address.readUtf16String();

  // skip english
  if (s.search(RE) === -1) {
    return null;
  }

  s = s
    .replace(/^@.+@/, "") // remove names '@オイゲン@「そう」' to '「そう」'
    .replace(/\$\w{1,2}/g, "") // remove noise '$A1'
    .replace(/\$\[|\$\/.+]/g, ""); // remove furigana '$[彷徨$/さまよ$]' to '彷徨'

  return s;
}
