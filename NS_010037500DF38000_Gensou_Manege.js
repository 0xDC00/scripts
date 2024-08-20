// ==UserScript==
// @name         [010037500DF38000] Gensou Manège
// @version      1.0.4
// @author       Mansive
// @description  Yuzu, Ryujinx
// * LOVE&ART & MAGES. Inc.
// ==/UserScript==
const gameVer = "1.0.4";

const { setHook } = require("./libYuzu.js");

const mainHandler = trans.send(handler, "200++");
const choiceHandler = trans.send(handler, "200+");

setHook(
  {
    "1.0.4": {
      [0x8124f690 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
      [0x811f63f0 - 0x80004000]: mainHandler.bind_(null, 0, "prompt"),
      [0x811917f4 - 0x80004000]: mainHandler.bind_(null, 0, "backlog"), // backlog accessed
      [0x81595f90 - 0x80004000]: choiceHandler.bind_(null, 1, "choices"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)]
);

let open = true;
let timer = null;
let previous = "";

function handler(regs, index, hookname) {
  // prevent backlog spam when rewinding to previous dialogue
  if (open === false && hookname === "dialogue") {
    clearTimeout(timer);
    timer = setTimeout(() => {
      open = true;
      mainHandler(regs, index, hookname); // output most recent text
    }, 200);
    return null;
  }

  // culprits of backlog spam
  if (hookname === "prompt" || hookname === "backlog") {
    open = false;
    return null;
  }

  const address = regs[index].value;
  // console.log("onEnter: " + hookname);

  let s = address.add(0x14).readUtf16String().replace(/\n/g, ""); // single line

  if (s === previous) {
    return null;
  }
  previous = s;

  return s;
}
