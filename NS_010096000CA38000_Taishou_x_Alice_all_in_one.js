// ==UserScript==
// @name         [010096000CA38000] Taishou x Alice all in one
// @version      1.0.2
// @author       Mansive
// @description  Yuzu, Ryujinx
// * Primula & PROTOTYPE & PRODUCTION PENCIL
// ==/UserScript==
const gameVer = "1.0.2";

const { setHook } = require("./libYuzu.js");

const mainHandler = handler;
const menuHandler = handler2;

setHook(
  {
    "1.0.2": {
      [0x80064ab8 - 0x80004000]: mainHandler.bind_(null, 1, "text"), // dialogue, choices
      [0x80064bd4 - 0x80004000]: mainHandler.bind_(null, 1, "delayed text"),
      [0x8015f968 - 0x80004000]: menuHandler.bind_(null, 0, "save/load menu"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

const texts = new Set();
let timer = null;
let open = true;
let delayed = false;
let inMenu = false;
let previous = "";
let previousImmediate = "";

function resetOpenTimer() {
  open = false;

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
    .replace(/^.+@/, "") // remove names '$t1オイゲン@「そう」' to '「そう」'
    .replace(/\$\w{1,2}/g, "") // remove noise '$A1'
    .replace(/\$\[|\$\/.+]/g, ""); // remove furigana '$[彷徨$/さまよ$]' to '彷徨'

  // prevent backlog spam
  if (s === "＿" || (s === previous && delayed === false)) {
    resetOpenTimer();
    return null;
  }

  if (delayed === true) {
    s = (previousImmediate + s).trim();
    delayed = false;
  }
  previousImmediate = s;

  // missing closing bracket means it's probably dialogue with delayed text
  if (s.at(0).search(/[「『（]/) === 0 && s.at(-1).search(/[」』）]/) === -1) {
    delayed = true;
  }

  texts.add(s);

  clearTimeout(timer);
  timer = setTimeout(() => {
    // necessary for preventing backlog spam
    if (inMenu === false) {
      previous = s;
    } else {
      inMenu = false;
    }

    trans.send([...texts].join("\r\n")); // joins choices
    texts.clear();
  }, 200);
}

function handler2() {
  // main hook can spam text from save/load menu
  // if this handler is called, it means we are in menu, so disable main hook
  inMenu = true;
  resetOpenTimer();
}
