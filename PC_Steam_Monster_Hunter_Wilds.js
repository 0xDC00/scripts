// ==UserScript==
// @name         Monster Hunter Wilds
// @version      1.000.04.00
// @author       Mansive
// @description  Steam
// * CAPCOM Co., Ltd.
//
// https://store.steampowered.com/app/2246340/Monster_Hunter_Wilds/
// ==/UserScript==

const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];

// using original size leads to access violation
__e.size = 0x10000000;

const texts = new Set();
let timer = null;
let open = false;

//#region Hooks

const hooks = [
  {
    name: "DialogueEnable",
    pattern:
      // "E8 46 11 B1 02 41 83 BE C0 02 00 00 03 41 0F 94 C0 48 89 F1 48 89 FA E8",
      "e8 ?? ?? ?? ?? 4? 83 b? ?? ?? ?? ?? ?? 4? 0f 94",
    register: null,
    handler: dialogueEnableHandler,
  }, // E8 4611B102
  {
    name: "Dialogue",
    pattern:
      // "FF 15 37 D1 44 04",
      "ff 15 ?? ?? ?? ?? 89 c2 4? 89 f9 4? 89 e0 4? 31 c9 e8 ?? ?? ?? ?? 4? 85 c0 75",
    register: "rax",
    handler: dialogueHandler,
  },
];

//#endregion

//#region Attach

/**
 * Scans a pattern in memory and returns a NativePointer for first match.
 * @param {string} name
 * @param {string} pattern
 * @returns {NativePointer}
 */
function getPatternAddress(name, pattern) {
  let results = null;

  try {
    results = Memory.scanSync(__e.base, __e.size, pattern);
  } catch (err) {
    throw new Error(`Error ocurred with [${name}]: ${err.message}`, {
      cause: err,
    });
  }

  if (results.length === 0) {
    throw new Error(`[${name}] Hook not found!`);
  } else if (results.length >= 2) {
    console.warn(`${name} has ${results.length} results`);
  }

  const address = results[0].address;

  console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);

  return address;
}

function attachHooks() {
  for (const hook of hooks) {
    const { name, pattern, register, handler } = hook;
    const address = getPatternAddress(name, pattern);

    Interceptor.attach(address, function () {
      handler.call(this, name, this.context[register]);
    });
  }
}

//#endregion

//#region Handlers

function genericHandler(text) {
  texts.add(text);

  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send([...texts].join("\r\n"));
    texts.clear();
  }, 200);
}

/** Temporarily enable {@link dialogueHandler}. */
function dialogueEnableHandler(name, address) {
  console.log(`onEnter: ${name}`);

  open = true;

  clearTimeout(timer);
  timer = setTimeout(() => {
    open = false;
    texts.clear();
  }, 1000);
}

function dialogueHandler(name, address) {
  if (open === false) {
    console.log(`\x1b[2mskipped: ${name}\x1b[0m`);
    return null;
  }

  console.log(`onEnter: ${name}`);

  const text = address.readUtf16String();
  genericHandler(text);
}

//#endregion

//#region Start

/**
 * Installing REFramework involves placing a customized dinput8.dll into the
 * game's folder.
 *
 * Because REFramework uses ImGui, we can detect if REFramework is installed
 * by checking if the game's dinput8.dll contains an export from ImGui.
 */
function checkForREFramework() {
  let found = false;

  // there can be multiple dinput8.dll, need to check each one
  for (const module of Process.enumerateModules()) {
    if (
      module.name.toLowerCase() === "dinput8.dll" &&
      module.findExportByName("igText") !== null
    ) {
      found = true;
      break;
    }
  }

  if (found === true) {
    console.log(`\x1b[32mREFramework found.\n\x1b[0m`);
    return true;
  } else if (found === false) {
    console.warn(`
      \rREFramework not found!
      \rThe game might crash horrifically.
      `);
    return false;
  }
}

function start() {
  console.warn(`
    \rThis script requires Capcom's anti-tamper to be disabled,
    \ror else attaching will cause the game to crash.

    \rOne way to disable it is by installing REFramework.
    \rLink: https://github.com/praydog/REFramework
    
    \rUse this script (and REFramework) at your own risk!
    `);

  checkForREFramework();
  attachHooks();
}

start();
