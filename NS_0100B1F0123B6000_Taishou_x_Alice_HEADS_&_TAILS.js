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

setHook(
  {
    "2.0.0": {
      [0x8009bb3c - 0x80004000]: mainHandler.bind_(null, 1, "text"), // dialogue, choices
      [0x8009bc58 - 0x80004000]: mainHandler.bind_(null, 1, "delayed text"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const RE =
  /[\p{Script=Han}\p{Script=Katakana}\p{Script=Hiragana}！-～\u3000-\u303f]/u;
const texts = new Set();
let timer = null;
let open = true;
let delayed = false;
let previous = "";
let previousImmediate = "";

function bracketsMatch(text) {
  return (
    (text.at(0) === "「" && text.at(-1) === "」") ||
    (text.at(0) === "『" && text.at(-1) === "』") ||
    (text.at(0) === "（" && text.at(-1) === "）")
  );
}
function resetOpenTimer() {
  open = false;
  delayed = false;

  clearTimeout(timer);
  timer = setTimeout(() => {
    open = true;
    texts.clear();
  }, 200);
}

function handler(regs, index, hookname) {
  if (open === false) {
    resetOpenTimer();
    return null;
  }

  const address = regs[index].value;
  // console.log("onEnter: ", hookname);

  let s = address
    .readUtf16String()
    .replace(/\$\w{1,2}/g, "") // remove noise '$A1'
    .replace(/\$\[|\$\/.+?]/g, ""); // remove furigana '$[彷徨$/さまよ$]' to '彷徨'

  // ignore text from save/load menus; prevent backlog spam
  if (s.at(0) === "【" || s === "＿" || (s === previous && delayed === false)) {
    resetOpenTimer();
    return null;
  }

  // skip english and prevent repeating the unfinished lines
  if (s.search(RE) === -1 || (hookname === "text" && delayed === true)) {
    return null;
  }

  // remove names '@オイゲン@「そう」' to '「そう」'
  // if length has decreased after name removal, it means the text was dialogue
  let isDialogue = false;
  if (s.length > (s = s.replace(/^.+@/, "")).length) {
    isDialogue = true;
  }

  if (delayed === true) {
    s = (previousImmediate + s).trim();
    if (bracketsMatch(s)) {
      delayed = false;
    }
  }
  previousImmediate = s;

  // missing closing bracket means it's probably dialogue with delayed text
  if (
    isDialogue === true &&
    hookname === "text" &&
    bracketsMatch(s) === false
  ) {
    delayed = true;
  }

  texts.add(s);

  clearTimeout(timer);
  timer = setTimeout(() => {
    previous = s;
    trans.send([...texts].join("\r\n")); // joins choices
    texts.clear();
  }, 200);
}
