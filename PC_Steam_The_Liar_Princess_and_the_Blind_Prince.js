// ==UserScript==
// @name         The Liar Princess and the Blind Prince (嘘つき姫と盲目王子)
// @version      0.1
// @author       Mansive
// @description  Steam
// * Nippon Ichi Software, Inc., Systemsoft beta, Inc.
// * NIS America, Inc.
//
// https://store.steampowered.com/app/3901910/The_Liar_Princess_and_the_Blind_Prince/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const sendText = trans.send((s) => s, "200+");

// both of these are hot hooks
const hooks = {
  CutsceneDialogue: {
    // pattern: "E8 5D 81 FE FF",
    pattern: "e8 ?? ?? ?? ?? 4? b0 ?? 4? 8d 55 80",
    handler: cutsceneDialogueHandler,
  },
  Hover: {
    // overworld, trophy, popups
    // pattern: "E8 AB 41 23 00",
    pattern: "e8 ?? ?? ?? ?? 8b ce 0f 28",
    handler: whateverHandler,
  },
};

for (const name in hooks) {
  const { pattern, handler } = hooks[name];
  attach(name, pattern, handler);
}

function attach(name, pattern, handler) {
  const results = Memory.scanSync(__e.base, __e.size, pattern);
  if (results.length === 0) {
    console.error(`[${name}] Hook not found!`);
    return;
  }
  const address = results[0].address;
  console.log(`\x1b[32m[${name}] @ ${address}\x1b[0m`);
  if (results.length > 1) {
    console.warn(`[${name}] has ${results.length} results`);
  }

  Breakpoint.add(address, function () {
    // console.log("onEnter:", name);
    handler.call(this, { name });
  });
}

let previousCutsceneDialogue = "";
function cutsceneDialogueHandler({ name }) {
  /** @type {NativePointer} */
  const length = this.context.r8;

  // game's button check?
  // PrincessAndPrince.exe+9A92 - 49 83 F8 0F           - cmp r8,0F
  if (length.compare(0x0f) <= 0) {
    return;
  }

  const text = this.context.rdx.readUtf8String();
  if (text === previousCutsceneDialogue) {
    return;
  }
  previousCutsceneDialogue = text;

  // console.warn("onFinish:", name);

  sendText(text);
}

const previousTexts = [, , , , , , , , , , , , , , ,]; // behold, javascript!
function whateverHandler() {
  /** @type {string} */
  const text = this.context.rdx.readUtf8String();
  if (previousTexts.includes(text)) {
    return;
  }

  // super lazy number check, but should be fast in a hot loop
  const firstChar = text[0];
  if ((firstChar >= "0" && firstChar <= "9") === true) {
    return;
  }

  previousTexts.push(text);
  previousTexts.shift();

  // console.warn("onFinish:", name, JSON.stringify(text));

  sendText(text);
}
