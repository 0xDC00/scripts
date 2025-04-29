// ==UserScript==
// @name         The Hundred Line -Last Defense Academy-
// @version      1.00
// @author       Mansive
// @description  Steam
// * Too Kyo Games, Media.Vision Inc.
// * Aniplex Inc.
//
// https://store.steampowered.com/app/3014080/The_Hundred_Line_Last_Defense_Academy/
// ==/UserScript==
const __e = Process.enumerateModules()[0];

// Need to implement
const YEEHAW_MODE = false;

const IS_DEBUG = false;
const BACKTRACE = false;
const INSPECT_ARGS = false;
const STOP_ON_MISSING_HOOK = false;

let hooksCount = 0;

const texts = new Set();
let timer = null;
let previous = "";

//#region Hooks

const hotHooks = {
  // CUTSCENEDIALOGUE1: {
  //   name: "CUTSCENEDIALOGUE1",
  //   pattern: "E8 68 BE 15 00",
  //   address: null,
  //   register: "rdx",
  //   argIndex: 1,
  //   readString(args) {
  //     return args[this.argIndex].readUtf16String();
  //   },
  // },
  // CUTSCENEDIALOGUE1INSIDE: {
  //   name: "CUTSCENEDIALOGUE1INSIDE",
  //   pattern:
  //     "48 8B C1 4C 8D 15 16 64 82 FF 49 83 F8 0F 0F 87 0C 01 00 00 66 66 66 66 0F 1F 84 00 00 00 00 00 47 8B 8C 82 30 E0 0B 01 4D 03 CA 41 FF E1",
  //   address: null,
  //   register: "rdx",
  //   argIndex: 1,
  //   readString(args) {
  //     return args[this.argIndex].readUtf16String();
  //   },
  // },
};

const hooks = {
  // CutsceneDialogue1: {
  //   pattern: "E8 68 BE 15 00",
  //   // argIndex: 1,
  //   register: "rdx",
  //   handler: mainUtf16Handler,
  // },
  // CutsceneDialogue2: {
  //   pattern: "E8 BC BD 15 00",
  //   // argIndex: 1,
  //   register: "rdx",
  //   handler: mainUtf16Handler,
  // },
  CutsceneDialogue: {
    // pattern: "E8 E5 57 24 00",
    // pattern: "48 8B D8 48 89 7C 24 28 48 89 7C 24 38 BF 0F 00 00 00 48 89 7C 24 40 C6 44 24 28 00 48 85 C0 74 23",
    // pattern: "4? 8b d8 4? 89 7c ?4 28 4? 89 7c ?4 38 bf ?? ?? ?? ?? 4? 89 7c ?4 40 c6 44 ?4 28 ?? 4? 85 c0 74 ??",
    pattern: "4? 8b d8 4? 89 7c ?4 28 4? 89 7c ?4 38 bf",
    register: "rax",
    handler: mainHandler,
  },
  // DialoguePreviousHook: {
  // pattern: "E8 C5130000",
  // register: "rcx",
  // handler: dialoguePreviousHandler,
  // },
  // DialogueHook1: {
  //   pattern:
  //     "48 85 C0 74 19 4C 8B C3 49 FF C0 42 80 3C 00 00 75 F6 48 8B D0 48 8D 4D C7 E8 18 51 CF FF",
  //   register: "rax",
  //   handler: mainHandler,
  // }, // E8 96EE0300 after, possibly redundant, only one text box
  DialogueHook: {
    // pattern: "E8 5D 4D 48 00",
    // pattern: "e8 ?? ?? ?? ?? 4? 89 64 ?? ?? 4? 89 64 ?? ?? 4? c7 44 ?? ?? ?? ?? ?? ?? 4? 88 64 ?? ?? 4? 8d 5c ?4 ff 4? 85 f6",
    pattern:
      "e8 ?? ?? ?? ?? 4? 89 64 ?? ?? 4? 89 64 ?? ?? 4? c7 44 ?? ?? ?? ?? ?? ?? 4? 88 64",
    argIndex: 2, // name
    register: "rsi",
    handler: mainHandler,
  }, // both text boxes
  TipsHook: {
    // pattern: "E8 20 E9 31 00",
    // pattern: "e8 ?? ?? ?? ?? 4? 8d 05 ?? ?? ?? ?? 4? 89 ?? ?? 4? 89 7? ?? 4? 8d ?? e7 4? 89 4? ?? 4? 63 97 98 01 00 00 4? 39 97 88 00 00 00 0f 86 ?? ?? ?? ??",
    pattern:
      "e8 ?? ?? ?? ?? 4? 8d 05 ?? ?? ?? ?? 4? 89 ?? ?? 4? 89 7? ?? 4? 8d ?? e7",
    register: "rax",
    handler: mainHandler,
  },
  SkillInfo: {
    // pattern: "E8 5F C3 34 00",
    // pattern: "e8 ?? ?? ?? ?? 90 4? 8b 5? ?? 4? 83 fa ?? 72 ?? 4? ff c2 4? 8b 4? ?? 4? 8b c1 4? 81 fa ?? ?? ?? ??"
    pattern: "4? 8b ?? ?? ?? ?? ?? 4? 8b 4f 40 e8 ?? ?? ?? ?? 90 4? 8b",
    register: "r8",
    handler: mainHandler,
  },
  BattleCenterPopup: {
    // pattern: "4C 89 7D CF 4C 89 7D DF 48 C7 45 E7 0F 00 00 00 44 88 7D CF 48 85 C0 0F 84 52 01 00 00",
    pattern:
      "4? 89 7? ?? 4? 89 7? ?? 4? c7 4? ?? ?? ?? ?? ?? 4? 88 7? ?? 4? 85 c0 0f 84 ?? ?? ?? ?? 4? 85",
    register: "rax",
    handler: mainHandler,
  },
  BattlePrompt: {
    // pattern: "E8 F8 47 32 00",
    pattern: "e8 ?? ?? ?? ?? 80 7f 33 ?? 4? 8d 05",
    register: "rax",
    handler: mainHandler,
  },
};

//#endregion

//#region Attach

/**
 * Scans a pattern in memory and returns a NativePointer for first match.
 * @param {string} name
 * @param {string} pattern
 * @returns {NativePointer}
 */
function getPatternAddress(name, pattern) {
  /** @type {MemoryScanMatch[]|null} */
  let results = null;

  try {
    results = Memory.scanSync(__e.base, __e.size, pattern);
  } catch (err) {
    throw new Error(`Error ocurred with [${name}]: ${err.message}`, {
      cause: err,
    });
  }

  if (results.length === 0) {
    if (STOP_ON_MISSING_HOOK) {
      throw new RangeError(`[${name}] not found!`);
    }
    return null;
  } else if (results.length > 1) {
    console.warn(`${name} has ${results.length} results`);
  }

  const address = results[0].address;

  console.log(`\x1b[32m[${name}] @ ${address}\x1b[0m`);

  return address;
}

function attachHooks() {
  for (const hook in hotHooks) {
    const name = hook;
    const pattern = hotHooks[name].pattern;
    hotHooks[hook].address = getPatternAddress(name, pattern);
  }

  for (const hook in hooks) {
    const name = hook;
    const result = attach({ name: name, ...hooks[hook] });

    if (result === true) {
      hooksCount += 1;
    } else {
      console.log("FAIL");
    }
  }
  console.log(`${hooksCount}/${Object.keys(hooks).length} hooks attached`);
}

/**
 * @param {Object} options
 * @param {string} options.name
 * @param {string} options.pattern
 * @param {string} options.register
 * @param {number} options.argIndex
 * @param {Object} options.target
 * @param {Function} options.handler
 * @returns {boolean}
 */
function attach({ name, pattern, register, argIndex, handler }) {
  const address = getPatternAddress(name, pattern);

  if (address === null) {
    console.warn(`[${name}] not found!`);
    return false;
  }

  Interceptor.attach(address, function (args) {
    console.log("onEnter: " + name);

    this.args = args;

    if (INSPECT_ARGS === true) {
      inspectArgs(args);
    }

    const textAddress = register ? this.context[register] : args[argIndex];
    const text = handler.call(this, textAddress) ?? null;

    if (text !== null) {
      // do something with text, maybe count characters
      if (IS_DEBUG) {
        console.warn(`${name.toUpperCase()}: ${JSON.stringify(text)}`);
      }
    } else if (text === null) {
      // console.log("skipped: " + name);
      return false;
    }
  });

  return true;
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

function mainHandler(address) {
  const text = address.readUtf8String();

  genericHandler(text);
  return text;
}

function mainUtf16Handler(address) {
  const text = address.readUtf16String();

  genericHandler(text);
  return text;
}

function dialoguePreviousHandler(address) {
  const id = address.add(8).readUtf8String(); // textMsg or textName

  const textAddress = address.add(0xa0);
  let text = "";

  if (id === "textMsg") {
    text = textAddress.readPointer().readUtf8String();
  } else if (id === "textName") {
    text = textAddress.readUtf8String();
  } else {
    console.warn(`Unidentified id: ${id}`);
  }

  genericHandler(text);
  return text;
}

trans.replace((s) => {
  if (s === previous || s === "") {
    return null;
  }
  previous = s;

  return s
    .replace(/{fc[^)]+\)([^}]+)}/g, "$1") // color
    .replace(/{keyhelp[^}]+}/g, "▢") // key buttons
    .replace(/{is\d{1,2}}{image[^}]+}/g, "▢") // image icons
    .replace(/{[^}]+/g, ""); // remove everything else
});

//#endregion

//#region Miscellaneous

/**
 * Attempts to print args as strings.
 * @param {InvocationArguments} args
 */
function inspectArgs(args) {
  const argsTexts = [];

  for (let i = 0; i <= 10; i++) {
    let type = "";
    let text = "";

    // yeehaw
    try {
      type = "S";
      text = args[i].readUtf8String();
    } catch (err) {
      try {
        type = "P";
        text = args[i].readPointer().readUtf8String();
      } catch (err) {
        try {
          type = "PP";
          text = args[i].readPointer().readPointer().readUtf8String();
        } catch (err) {
          continue;
        }
      }
    }

    if (text === "" || text === null) {
      continue;
    }

    argsTexts.push(`${type}|args[${i}]=${text}`);
    // argsTexts.push(`args[${i}]=${args[i]}`);
  }

  for (const text of argsTexts) {
    console.log(`\x1b[45m${text}\x1b[0m`);
  }
  argsTexts.length = 0;
}

/** Prints the backtrace or callstack for a hook. */
function startTrace() {
  console.warn("Tracing!!");

  const traceTarget = hotHooks.CUTSCENEDIALOGUE1;
  const traceAddress = getPatternAddress(traceTarget.name, traceTarget.pattern);
  const previousTexts = new Set();

  Interceptor.attach(traceAddress, {
    onEnter(args) {
      let text = "";

      try {
        text = traceTarget.readString(args);
      } catch (err) {
        console.error("Reading address failed:", err.message);
        return null;
      }

      if (previousTexts.has(text)) {
        return null;
      }
      previousTexts.add(text);

      const callstack = Thread.backtrace(this.context, Backtracer.FUZZY);

      console.log(`
        \rONENTER: ${traceTarget.name}
        \r${text}
        \rCallstack: ${callstack.splice(0, 8)}
        \rReturn: ${this.returnAddress}`);

      if (INSPECT_ARGS === true) {
        inspectArgs(args);
      }
    },
    // onLeave(retval) {
    //   const text = retval.readUtf8String();

    //   if (previousTexts.has(text)) {
    //     return null;
    //   }
    //   previousTexts.add(text);

    //   console.log("Leaving!");
    //   console.warn("onleave returnaddress:", this.returnAddress);
    //   console.warn("retval:", text);
    // },
  });
}

// in case im being a dumbass
/**
 * A normal hook consists of a pattern and handler.
 * It may have either or both register and argIndex, but never neither.
 */
function validateHooks() {
  function expose(name, property) {
    throw new TypeError(`[${name}] ${property} is of type ${typeof property}`);
  }

  for (const hookName in hooks) {
    const hook = hooks[hookName];
    let { pattern, register, argIndex, handler } = hook;

    if (typeof pattern !== "string") {
      expose(hookName, pattern);
    }
    if (register && typeof register !== "string") {
      expose(hookName, register);
    }
    if (argIndex && typeof argIndex !== "number") {
      expose(hookName, argIndex);
    }
    if (typeof handler !== "function") {
      expose(hookName, handler);
    }
  }
}

//#endregion

//#region Start

function start() {
  if (BACKTRACE === true) {
    startTrace();
    return true;
  }

  validateHooks();
  attachHooks();
}

start();

//#endregion
