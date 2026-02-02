// ==UserScript==
// @name         [010068501FF9A000] UN:LOGICAL (UNLOGICAL)
// @version      1.0.0, 1.0.1
// @author       Mansive
// @description  Yuzu
// * LicoBiTs
// * Broccoli
// ==/UserScript==
const gameVer = "1.0.0";
``;
const { setHook } = require("./libYuzu.js");
// const mainHandler = trans.send(handler, "200+");
// const listHandler = trans.send(handler2, "200+");

let timer;
const texts = new Set();
const topTexts = new Set();
const bottomTexts = new Set();

function genericHandler(text) {
  texts.add(text);
  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send([...texts].join("\r\n"));
    texts.clear();
  }, 200);
}

function _orderedHandler() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send([...topTexts].join("\r\n") + "\r\n" + [...bottomTexts].join("\r\n"));
    topTexts.clear();
    bottomTexts.clear();
  }, 200);
}

function topHandler(text) {
  topTexts.add(text) && _orderedHandler();
}

function bottomHandler(text) {
  bottomTexts.add(text) && _orderedHandler();
}

setHook(
  {
    "1.0.0": {
      [0x818ec8e0 - 0x80004000]: mainHandler.bind_(null, 1, "dialogue"),
      [0x81c0db08 - 0x80004000]: choiceDescHandler.bind_(null, 0, "choice desc"),
      [0x818e43c4 - 0x80004000]: choiceOptionHandler.bind_(null, 1, "choice option"),
      [0x81a1bbb8 - 0x80004000]: mainHandler.bind_(null, 0, "dict"),
      [0x81a69d5c - 0x80004000]: mainHandler.bind_(null, 0, "news1"),
      [0x81a69dbc - 0x80004000]: mainHandler.bind_(null, 0, "news2"),
      [0x81a69e38 - 0x80004000]: listHandler.bind_(null, 0, "note"),
      [0x81b68c30 - 0x80004000]: listHandler.bind_(null, 2, "rule"),
      // [0x81a10008 - 0x80004000]: mainHandler.bind_(null, 1, "prompt"),
    },
  }[(globalThis.gameVer = globalThis.gameVer ?? gameVer)],
);

const playerName = "Hello";

function readString(regs, index, hookname) {
  console.log("onEnter: " + hookname);
  const address = regs[index].value;

  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
  const len = address.add(0x10).readU32();
  let text = address.add(0x14).readUtf16String(len);

  console.warn(JSON.stringify(text));

  return text;
}

function mainHandler(regs, index, hookname) {
  let text = readString(...arguments);

  text = text.replace(/\n\u{3000}?/gu, ""); // single line
  text = text.replace(/\[主人公\]/g, playerName); // placeholder name
  text = text.replace(/\[dic.*?text=/g, ""); // dictionary words
  text = text.replace(/\[|'.*?\]/g, ""); // ruby text
  text = text.replace(/\]/g, ""); // closing brace if no ruby text

  text = text + hookname;

  genericHandler(text);
}

function listHandler(regs, index, hookname) {
  const text = readString(...arguments);

  genericHandler(text);
}

function choiceDescHandler(regs, index, hookname) {
  let text = readString(...arguments);

  text = text.replace(/\\n/g, "\n");

  topHandler(text);
}

function choiceOptionHandler(regs, index, hookname) {
  const text = readString(...arguments);

  bottomHandler(text);
}

let previous = "";
trans.replace((s) => {
  if (s === previous) {
    console.warn("skipped duplicate");
    return null;
  }
  previous = s;

  return s;
});
