// ==UserScript==
// @name         Atelier Lydie & Suelle: The Alchemists and the Mysterious Paintings DX (リディー＆スールのアトリエ ～不思議な絵画の錬金術士～ DX)
// @version      1.01
// @author       Mansive
// @description  Steam
// * Gust
// * KOEI TECMO GAMES CO., LTD.
//
// https://store.steampowered.com/app/1502990
// ==/UserScript==

//#region Types

/**
 * @callback TreasureArgsFunction
 * @param {Object} treasure
 * @param {InvocationArguments} treasure.args
 * @returns {NativePointer}
 */

/**
 * @callback TreasureContextFunction
 * @param {Object} treasure
 * @param {X64CpuContext} treasure.context
 * @returns {NativePointer}
 */

/**
 * @typedef {Object} TargetHook
 * @property {string} name
 * @property {string | MatchPattern} pattern
 * @property {NativePointer} address - Mainly used for debugging
 * @property {string} register
 * @property {number} argIndex
 * @property {TreasureArgsFunction | TreasureContextFunction} getTreasureAddress
 */

/**
 * @typedef {Object} Hook
 * @property {string | MatchPattern} pattern
 * @property {string=} register
 * @property {number=} argIndex
 * @property {TargetHook=} target
 * @property {string[]=} origins
 * @property {HookHandler} handler
 */

/**
 * New InvocationContext with specified X64CpuContext because VSCode can't
 * perfectly resolve the generic CpuContext
 * @typedef {Omit<InvocationContext, "context"> & { context: X64CpuContext }} X64InvocationContext
 */

/**
 * @callback HookHandler
 * @this {X64InvocationContext}
 * @param {NativePointer} address
 * @returns {string | null=}
 */

//#endregion

//#region Some Globals

// name 0x140079663,0x14030346d,0x14037e366,0x14037c8d7,0x14037c635,0x14037964a,0x14037957f,0x1403799af
// text 0x140079663,0x14030315c,0x14037f8f8,0x14037c656,0x14037964a,0x14037957f,0x1403799af,0x14026ce32

const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];

const BACKTRACE = false;

const INSPECT_ARGS_REGS = true;
const DEBUG_LOGS = true;

let convertToSingleLine = true;

let hooksPrimaryCount = 0;
let hooksAuxCount = 0;

let previous = "";

/** @type {string[]} */
// ROOT:Event/event/MM01/EVENT_MESSAGE_MM01_010.ebm
const eventTexts = [];
let previousEventId = 0;

const returnAddresses = new Set();

//#endregion

//#region Hooks

const hooksStatus = {
  // exampleHookName: { enabled: true, characters: 0 },
};

// ASLR disabled
/** @type {Object.<string, TargetHook>} */
const targetHooks = {
  SHALLOW: {
    name: "SHALLOW",
    pattern: "48 2B D1 49 83 F8 08 72 22 F6 C1 07 74 14",
    address: ptr(0x1408440c0),
    register: "rdx",
    argIndex: 1,
    /** @type {TreasureContextFunction} */
    getTreasureAddress({ context }) {
      return context[this.register];
    },
  },
  ENCY: {
    name: "ENCY",
    pattern: "48 8B D8 48 85 C0 74 53 48 8B D0 48 89 74 24 30 48 8D 4F 08 E8",
    address: ptr(0x140303454),
    register: "rax",
    argIndex: -1,
    /** @type {TreasureContextFunction} */
    getTreasureAddress({ context }) {
      return context[this.register];
    },
  },
};

//#region Hooks: Main

const hooksMain = {
  DialogueName: {
    pattern: "E8 2A47FCFF",
    target: targetHooks.SHALLOW,
    handler: mainHandler,
  },
  DialogueText: {
    pattern: "E8 2837F8FF",
    register: "r8",
    handler: mainHandler,
  },
  EventText: {
    pattern: "e8 ?? ?? ?? ?? 8b 5? ?? 4? 8d 4? ?? 4? 63 cb 4? 8b d0 e8",
    register: "rdx",
    handler: eventTextHandler,
  },
  Telop: {
    pattern: "e8 ?? ?? ?? ?? b2 01 4? 89 8? ?? ?? ?? ?? 4? 8b c8 e8",
    register: "rdx",
    handler: telopHandler,
  },
};

//#endregion

//#region Hooks: Misc

const hooksMiscellaneous = {
  QuestName: {
    pattern: "E8 EA01F3FF",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  QuestIncompleteInfo: {
    pattern: "E8 26F0F2FF",
    target: targetHooks.ENCY,
    handler: positionMiddleSingleHandler,
  },
  QuestDetail1: {
    pattern: "E8 FAEFF2FF",
    target: targetHooks.ENCY,
    handler: questDetailHandler,
  },
  QuestDetail2: {
    pattern: "E8 3DEEF2FF",
    target: targetHooks.ENCY,
    handler: questDetailHandler,
  },
  StatusSkillInfo: {
    // RDX, RDI, and R14 all increment by one when scrolling down each skill. Potential hook for name?
    pattern: "E8 A386F7FF",
    target: targetHooks.ENCY,
    handler: positionMiddleSingleHandler,
  },
};

//#endregion

//#region Hooks: Battle

const hooksBattle = {};

//#endregion

//#region Hooks: Synth

const hooksSynthesis = {
  RecipeSynthesisName: {
    pattern: "E8 68962200",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  RecipeSynthesisMaterialSpecific: {
    pattern: "E8 E49A2200",
    target: targetHooks.ENCY,
    handler: positionBottomListHandler,
  },
  RecipeSynthesisMaterialCategory: {
    pattern: "E8 1E9B2200",
    target: targetHooks.ENCY,
    handler: positionBottomListHandler,
  },
  ItemName: {
    pattern: "E8 07F90400",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  ItemEffect: {
    pattern: "E8 79F60400",
    target: targetHooks.ENCY,
    handler: positionBottomListHandler,
  },
  ItemTrait: {
    pattern: "E8 C6F00400",
    target: targetHooks.ENCY,
    handler: positionBottomListHandler,
  },
};

//#endregion

//#region Hooks: Ency

const hooksEncyclopedia = {
  EncyclopediaHelpName: {
    pattern: "E8 472F2C00",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  EncyclopediaHelpInfo: {
    pattern: "48 89 5C 24 10 57 48 83 EC 20 48 8B F9 8B CA E8 7C 0E F3 FF", // above ency
    origins: [
      "49 8B 4C 24 28 33 D2 48 8B 01 FF 50 20 49 8B 8C 24 98 00 00 00 41 83 C9 FF 45 33 C0 48 8B 89 20 02 00 00 41 8D 51 02 E8 11 47 1B 00", // open help menu
      "48 8B 7C 24 38 33 C0 48 83 C4 20 5B C3 49 8B 8A 20 02 00 00 41 83 C9 FF 45 33 C0 33 D2 E8 6A 45 1B 00", // switch entry
      "48 8B 7C 24 38 33 C0 48 83 C4 20 5B C3 48 8B CB 89 BB A8 00 00 00 E8 EC F7 FF FF", // flip entry page
      // "39 BB AC 00 00 00 0F 8E A0 00 00 00", // flip menu page
    ],
    target: targetHooks.ENCY,
    handler: encyclopediaHelpInfoHandler,
  },
  EncyclopediaItemName: {
    pattern: "E8 D1CA2B00",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  EncyclopediaEffectName: {
    pattern: "E8 164D2C00",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  EncyclopediaEffectInfo: {
    pattern: "E8 FC4C2C00",
    target: targetHooks.ENCY,
    handler: positionMiddleHandler,
  },
  EncyclopediaTraitName: {
    pattern: "E8 C43D2C00",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  EncyclopediaTraitInfo: {
    pattern: "E8 AA3D2C00",
    target: targetHooks.ENCY,
    handler: positionMiddleHandler,
  },
  EncyclopediaAreaName: {
    pattern: "E8 43902B00",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  EncyclopediaDialogue: {
    pattern: "E8 79642C00",
    target: targetHooks.ENCY,
    handler: encyclopediaDialogueHandler,
  },
};

//#endregion

//#region Hooks: All

// Combine all sets of hooks into one object for ease of use
/** @type {Object.<string, Hook>} */
const hooks = Object.assign(
  {},
  hooksMain,
  hooksMiscellaneous,
  hooksBattle,
  hooksSynthesis,
  hooksEncyclopedia
);

const hooksPrimaryTotal = Object.keys(hooks).length;

//#endregion

//#endregion

//#region Strategies

/**
 * Returns a NativePointer from either the arguments or registers depending
 * on how the targeted hook extracts text.
 * @param {Object} options
 * @param {TargetHook} options.target
 * @param {InvocationArguments} options.args
 * @param {X64CpuContext} options.context
 * @returns {NativePointer}
 */
function getTreasureAddress({ target, args, context }) {
  return target.getTreasureAddress({ args, context });
}

/**
 * Hooks an address and checks the return addresses before invoking the handler.
 * Expects the address argument to be from the function prologue.
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function filterReturnsStrategy({ address, name, register, handler }) {
  Breakpoint.add(address, function () {
    const returnAddress = this.context.rsp.readPointer();
    // console.warn("filtering: " + returnAddress);

    if (returnAddresses.has(returnAddress.toInt32())) {
      return null;
    }

    DEBUG_LOGS && console.warn("passedFilter: " + name);

    if (hooksStatus[name].enabled === false) {
      logDim("skipped: " + name);
      return false;
    }

    if (INSPECT_ARGS_REGS === true) {
      console.log("in: ORIGIN");
      inspectRegs(this.context);
    }

    const text = handler.call(this, this.context[register]);
    setHookCharacterCount(name, text);
  });
}

/**
 * Hooks an address as the origin, then temporarily hooks a target address
 * whenever the origin is accessed.
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function nestedHooksStrategy({ address, name, target, handler }) {
  Breakpoint.add(address, function () {
    if (hooksStatus[name].enabled === false) {
      logDim("skipped: " + name);
      return false;
    }

    console.log("onEnter: " + name);

    if (INSPECT_ARGS_REGS === true) {
      console.log("in: ORIGIN");
      inspectRegs(this.context);
    }

    // this.outerArgs = outerArgs;

    hotAttach(target.address, function () {
      if (INSPECT_ARGS_REGS === true) {
        console.log("in: TARGET");
        inspectRegs(this.context);
      }

      const text = handler(getTreasureAddress({ target, context: this.context }));
      setHookCharacterCount(name, text);
    });
  });
}

/**
 * Combination of {@link nestedHooksStrategy} and {@link filterReturnsStrategy}.
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function filterReturnsNestedHooksStrategy({ address, name, target, handler }) {
  Breakpoint.add(address, function () {
    const returnAddress = this.context.rsp.readPointer();
    // console.warn("filtering: " + returnAddress);

    if (!returnAddresses.has(returnAddress.toInt32())) {
      return null;
    }

    DEBUG_LOGS && console.warn("passedFilter: " + name);

    if (hooksStatus[name].enabled === false) {
      logDim("skipped: " + name);
      return false;
    }

    console.log("onEnter: " + name);

    if (INSPECT_ARGS_REGS === true) {
      console.log("in: ORIGIN");
      inspectRegs(this.context);
    }

    // const outerContext = this.context;

    hotAttach(target.address, function () {
      if (INSPECT_ARGS_REGS === true) {
        console.log("in: TARGET");
        inspectRegs(this.context);
      }

      // this.outerContext = outerContext;

      const text = handler(getTreasureAddress({ target, context: this.context }));
      setHookCharacterCount(name, text);
    });
  });
}

/** @param {Hook & {name: string} & {address: NativePointer}} */
function normalStrategy({ address, name, register, handler }) {
  Breakpoint.add(address, function () {
    if (hooksStatus[name].enabled === false) {
      logDim("skipped: " + name);
      return false;
    }

    console.log("onEnter: " + name);

    if (INSPECT_ARGS_REGS === true) {
      inspectRegs(this.context);
    }

    const text = handler.call(this, this.context[register]) ?? null;
    setHookCharacterCount(name, text);
  });
}

//#endregion

//#region Attach

/**
 * Wrapper around "Interceptor.attach". Quickly detach after attaching.
 * @param {NativePointer} address
 * @param {Function} callback
 */
function hotAttach(address, callback) {
  const hook = Interceptor.attach(address, function (args) {
    hook.detach();
    Interceptor.flush();

    this.args = args;

    callback.call(this, args);
  });
}

/**
 * Scans a pattern in memory asynchronously and returns a Promise that resolves
 * with a NativePointer for the first match.
 * @param {string} name
 * @param {string} pattern
 * @param {{failed: boolean}} scanState
 * @returns {Promise<NativePointer>}
 */
function getPatternAddressAsync(name, pattern, scanState) {
  return new Promise((resolve, reject) => {
    const results = [];

    Memory.scan(__e.base, __e.size, pattern, {
      onMatch(address, size) {
        if (scanState.failed === true) {
          return reject(new Error("Failed scan for a hook"));
        }

        results.push(address);
      },
      onError(reason) {
        scanState.failed = true;
        reject(new Error(`Error occurred with [${name}]: ${reason}`));
      },
      onComplete() {
        if (scanState.failed === true) {
          return reject(new Error("Failed scan for a hook"));
        }

        if (results.length === 0) {
          scanState.failed = true;
          return reject(new Error(`[${name}] Not found!`));
        }

        const address = results[0];
        console.log(`\x1b[32m[${name}] @ ${address}\x1b[0m`);
        if (results.length > 1) {
          console.warn(`[${name}] has ${results.length} results`);
        }

        resolve(address);
      },
    });
  });
}

async function setupHooksAsync() {
  const scanQueue = {
    /** @type {{names: Array<string>, promises: Array<Promise<NativePointer>>, addresses: Array<NativePointer>}} */
    targets: { names: [], promises: [], addresses: [] },
    /** @type {{names: Array<string>, promises: Array<Promise<NativePointer>>, addresses: Array<NativePointer>}} */
    normals: { names: [], promises: [], addresses: [] },
    /** @type {{promises: Array<Promise<NativePointer>>, addresses: Array<NativePointer>}} */
    returns: { promises: [], addresses: [] },
  };
  const scanState = { failed: false };

  // set up targetHooks
  for (const hook in targetHooks) {
    const name = hook;
    const pattern = targetHooks[name].pattern;
    const promise = getPatternAddressAsync(name, pattern, scanState);
    scanQueue.targets.names.push(name);
    scanQueue.targets.promises.push(promise);
  }

  // set up normal hooks and origins
  for (const hook in hooks) {
    const name = hook;
    const { pattern, origins } = hooks[name];

    if (origins) {
      for (const origin of origins) {
        const promise = getPatternAddressAsync(name + "RETURN", origin, scanState);
        scanQueue.returns.promises.push(promise);
      }
    }

    const promise = getPatternAddressAsync(name, pattern, scanState);
    scanQueue.normals.names.push(name);
    scanQueue.normals.promises.push(promise);
  }

  // wait for the scans to finish
  scanQueue.targets.addresses = await Promise.all(scanQueue.targets.promises);
  scanQueue.normals.addresses = await Promise.all(scanQueue.normals.promises);
  scanQueue.returns.addresses = await Promise.all(scanQueue.returns.promises);

  // sanity check
  for (const queue of Object.values(scanQueue)) {
    if (queue.promises.length !== queue.addresses.length) {
      throw new Error("Mismatch in number of promises and addresses found.");
    }
  }

  // assign addresses for target hooks
  for (const [i, name] of scanQueue.targets.names.entries()) {
    targetHooks[name].address = scanQueue.targets.addresses[i];
    hooksAuxCount += 1;
  }

  // set return addresses
  for (const returnAddress of scanQueue.returns.addresses) {
    returnAddresses.add(returnAddress.toUInt32());
    hooksAuxCount += 1;
  }

  // attach normal hooks
  for (const [i, name] of scanQueue.normals.names.entries()) {
    const address = scanQueue.normals.addresses[i];
    const result = attachHook({ name, address, ...hooks[name] });

    if (result === true) {
      hooksStatus[name] = { enabled: true, characters: 0 };
      hooksPrimaryCount += 1;
    } else {
      console.log("FAIL");
    }
  }

  console.log(`
${hooksPrimaryCount} primary hooks attached
${hooksAuxCount} auxiliary hooks on standby
${hooksPrimaryCount + hooksAuxCount} total hooks
  `);
}

/** @param {Hook & {name: string} & {address: NativePointer}} */
function attachHook(params) {
  const { name, target, origins } = params;
  const args = params;

  if (origins && target) {
    DEBUG_LOGS &&
      console.log(`[${name}] filtered with return addresses and targeting [${target.name}]`);
    filterReturnsNestedHooksStrategy(args);
  } else if (origins) {
    DEBUG_LOGS && console.log(`[${name}] filtered with return addresses`);
    filterReturnsStrategy(args);
  } else if (target) {
    DEBUG_LOGS && console.log(`[${name}] targeting [${target.name}]`);
    nestedHooksStrategy(args);
  } else {
    normalStrategy(args);
  }

  return true;
}

//#endregion

//#region Handlers

function readFushigiString(address) {
  const text = address.readUtf8String();

  DEBUG_LOGS && console.log(`${color.FgYellow}${JSON.stringify(text)}${color.Reset}`);

  return text;
}

class GenericHandler {
  texts = new Set();
  delay = 200;
  timer = null;

  constructor(delay = this.delay) {
    this.delay = delay;

    const callableInstance = (...args) => {
      return this.genericHandler(...args);
    };
    Object.setPrototypeOf(callableInstance, this);

    return callableInstance;
  }

  /** @param {string} text */
  genericHandler(text) {
    this.texts.add(text);

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      trans.send([...this.texts].join("\r\n"));
      this.texts.clear();
    }, this.delay);
  }
}

const genericHandler = new GenericHandler();
const genericHandler2 = new GenericHandler(250);

class OrderedHandler {
  #delay = 600;
  #timer = null;
  /** @type {Array<Set<string>>} */
  positionalSets = [];

  /** @param {number} numOfPositions */
  constructor(numOfPositions, delay = this.#delay) {
    // initialize array of sets
    for (let i = 0; i < numOfPositions; i++) {
      this.positionalSets.push(new Set());
    }
    this.#delay = delay;

    // make OrderedHandler callable
    const callableInstance = (...args) => {
      return this.orderedHandler(...args);
    };
    Object.setPrototypeOf(callableInstance, this);

    return callableInstance;
  }

  /**
   * Positions are ordered from highest to lowest depending on their array index.
   * @returns {Array<Set<string>>}
   */
  get positions() {
    return this.positionalSets;
  }

  textsSetControl(text, set, list = false, preClearSet) {
    preClearSet?.clear();
    !list && set.clear();
    set.add(text);
  }

  /**
   * Handles text that should be ordered by position.
   * @param {string} text The text to add
   * @param {Set<string>} positionalSet The set to add text to
   * @param {boolean} list Whether to treat the text as part of a list
   * @param {Set<string>=} preClearSet The set to clear before adding text
   */
  orderedHandler(text, positionalSet, list = false, preClearSet) {
    this.textsSetControl(text, positionalSet, list, preClearSet);

    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const allTexts = this.positionalSets.flatMap((s) => [...s]);
      trans.send(allTexts.join("\r\n"));

      this.positionalSets.forEach((s) => s.clear());
    }, this.#delay);
  }

  isActive() {
    return this.positionalSets.some((s) => s.size > 0);
  }
}

const orderedHandler = new OrderedHandler(5);
const [priorityTexts, topTexts, middleTexts, bottomTexts, deepTexts] = orderedHandler.positions;

// binds
function positionPrioritySetter(text, list = false) {
  orderedHandler(text, priorityTexts, list);
}

function positionTopSetter(text, list = false) {
  orderedHandler(text, topTexts, list, bottomTexts);
}

function positionMiddleSetter(text, list = false) {
  orderedHandler(text, middleTexts, list, bottomTexts);
}

function positionBottomSetter(text, list = false) {
  orderedHandler(text, bottomTexts, list);
}

function positionDeepSetter(text, list = false) {
  orderedHandler(text, deepTexts, list);
}

/** @type {HookHandler & {list: boolean}} */
function positionMiddleHandler(address, list = false) {
  const text = readFushigiString(address);

  positionMiddleSetter(text, list);

  return text;
}

/** @type {HookHandler} */
function positionMiddleListHandler(address) {
  return positionMiddleHandler(address, true);
}

/** @type {HookHandler} */
function positionMiddleSingleHandler(address) {
  let text = readFushigiString(address);

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])\^00/g, "$1");
  }

  positionMiddleSetter(text, false);

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionTopHandler(address, list = false) {
  const text = readFushigiString(address);

  positionTopSetter(text, list);

  return text;
}

/** @type {HookHandler} */
function positionTopListHandler(address) {
  return positionTopHandler(address, true);
}

/** @type {HookHandler & {list: boolean}} */
function positionBottomHandler(address, list = false) {
  const text = readFushigiString(address);

  positionBottomSetter(text, list);

  return text;
}

/** @type {HookHandler} */
function positionBottomListHandler(address) {
  return positionBottomHandler(address, true);
}

/** @type {HookHandler & {list: boolean}} */
function positionPriorityHandler(address, list = false) {
  const text = readFushigiString(address);

  positionPrioritySetter(text, list);

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionDeepHandler(address, list = false) {
  const text = readFushigiString(address);

  positionPrioritySetter(text, list);

  return text;
}

/** @type {HookHandler} */
function positionDeepListHandler(address) {
  return positionDeepHandler(address, true);
}

/** @type {HookHandler} */
function mainHandler(address) {
  let text = readFushigiString(address);

  if (convertToSingleLine === true) {
    // text = text.replace(/([^。…？！])<CR>/g, "$1");
    text = text.replace(/(?![^：]+：)([^。…？！])\^00/g, "$1");
  }

  genericHandler(text);
  return text;
}

/** @type {HookHandler} */
function mainHandler2(address) {
  const text = readFushigiString(address);

  genericHandler(text);
  return text;
}

/**
 * Called for each text in an event. The game loads every text an event needs,
 * all of which this handler will store into an array. Other handlers will
 * consume the stored text.
 * @type {HookHandler}
 */
function eventTextHandler(address) {
  // RBX for first event text will have eventId, subsequent will have boxType
  const rbx = this.context.rbx;

  // lazily check if RBX has eventId
  // ROOT:Event/event/MM01/EVENT_MESSAGE_MM01_010.ebm
  // ROOT -> 52 4F 4F 54
  if (rbx.readU8() === 0x52 && rbx.add(3).readU8() === 0x54) {
    // second round of texts are exactly the same(?) as first round, might as
    // well clear the array instead of wasting time filtering individual dupes
    eventTexts.length = 0;
    previousEventId = rbx.readUtf8String();
    console.warn("Starting Event: " + previousEventId);
  } else {
    console.warn("Not event");
    return null;
  }

  const remainder = this.context.r15;

  // last one in the event
  if (remainder.equals(0x1)) {
    console.warn("End of Event:" + previousEventId);
  }

  // not exactly sure that this number is the box's type
  // 0x2 = full box
  // 0x3 = floating bottom box?
  // const boxType = address.sub(32).readU8();

  // the +1 is probably for null terminator
  // const lengthInBytes = address.readU8() + 1;

  const text = readFushigiString(address.add(4));
  eventTexts.push(text);
}

/**
 * Consume stored texts from {@link eventTexts}.
 * @type {HookHandler}
 */
function telopHandler(address) {
  const id = readFushigiString(address);

  // https://en.wikipedia.org/wiki/Telop
  if (id.startsWith("telop")) {
    DEBUG_LOGS && console.warn("Is Paragraph");
  } else if (id.startsWith("name")) {
    DEBUG_LOGS && console.warn("Is Name");
    return null;
  } else {
    DEBUG_LOGS && console.warn("Unidentified ID: " + id);
    return null;
  }

  let text = eventTexts.shift();

  if (typeof text === "undefined") {
    return null;
  }

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])\^00/g, "$1");
  }

  genericHandler(text);
  return text;
}

/** @type {HookHandler} */
function questDetailHandler(address) {
  let text = readFushigiString(address);

  if (convertToSingleLine === true) {
    // text = text.replace(/([^。…？！）])\^00/g, "$1");
  }

  positionBottomSetter("\r\n" + text, false);

  return text;
}

/** @type {HookHandler} */
function encyclopediaHelpInfoHandler(address) {
  let text = readFushigiString(address);

  // turn subheadings into newlines
  text = text.replace(/([^、])\^00<CLGR>|<CLNR>\^00/g, "$1\r\n");

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])\^00/g, "$1");
  }

  positionMiddleSetter(text, false);

  return text;
}

/** @type {HookHandler} */
function encyclopediaDialogueHandler(address) {
  let text = readFushigiString(address);

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！）])\^00\u3000/g, "$1");
  }

  positionMiddleSetter(text, false);

  return text;
}

trans.replace((s) => {
  if (s === previous || s === "") {
    return null;
  }
  previous = s;

  return (
    s
      // .replace(/<CR>/g, "\r\n") // replace with actual newline
      .replace(/\^00/g, "\r\n") // replace with actual newline, L&S
      .replace(/<IM\d+>/g, "▢") // supposed to be a button on controller/keyboard
      .replace(/<[^>]+>/g, "") // deal with everything else
      .trim()
  );
});

//#endregion

//#region Miscellaneous

/**
 * Attempts to print arguments' values as strings.
 * @param {InvocationArguments} args
 */
function inspectArgs(args) {
  const argsTexts = [];

  for (let i = 0; i <= 10; i++) {
    let type = "";
    let text = "";

    // yeehaw
    try {
      type = "P";
      text = args[i].readPointer().readUtf8String();
    } catch (err) {
      try {
        type = "PP";
        text = args[i].readPointer().readPointer().readUtf8String();
      } catch (err) {
        try {
          type = "S";
          text = args[i].readUtf8String();
        } catch (err) {
          // type = "A";
          // text = args[i].toString();
          continue;
        }
      }
    }

    if (text === null || text.length === 0 || /^\\/g.test()) {
      continue;
    }

    // text += args[i].toString();
    argsTexts.push(`${type}|args[${i}]=${JSON.stringify(text)}`);
  }

  for (const text of argsTexts) {
    console.log(`${color.BgMagenta}${text}${color.Reset}`);
  }
  argsTexts.length = 0;
}

/**
 * Attempts to print registers' values as strings.
 * @param {X64CpuContext} context
 */
function inspectRegs(context) {
  const regsTexts = [];
  const regs = [
    "rax",
    "rbx",
    "rcx",
    "rdx",
    "rsi",
    "rdi",
    "rbp",
    "rsp",
    "r8",
    "r9",
    "r10",
    "r11",
    "r12",
    "r13",
    "r14",
    "r15",
    // "rip",
  ];

  let text = "";
  let address = NULL;

  for (const reg of regs) {
    address = context[reg];
    try {
      text = address.readUtf8String();
    } catch (err) {
      continue;
    }

    if (text === null || text.length === 0 || /^\\/g.test()) {
      continue;
    }

    regsTexts.push(`${reg}=${JSON.stringify(text)}`);
  }

  for (const text of regsTexts) {
    console.log(`${color.BgBlue}${text}${color.Reset}`);
  }
  regsTexts.length = 0;
}

/** Prints the backtrace or callstack for a hook. */
async function startTrace() {
  console.warn("Tracing!!");

  const traceTarget = targetHooks.SHALLOW;

  const scanState = { failed: false };
  let traceAddress = NULL;
  try {
    traceAddress = await getPatternAddressAsync(traceTarget.name, traceTarget.pattern, scanState);
  } catch (err) {
    throw err;
  }
  traceTarget.address = traceAddress;
  const previousTexts = new Set();

  Interceptor.attach(traceAddress, {
    onEnter(args) {
      let text = "";
      const context = this.context;
      try {
        text = getTreasureAddress({
          target: traceTarget,
          args,
          context,
        }).readUtf8String();
      } catch (err) {
        // console.error("Reading from address failed:", err.message);
        return null;
      }

      if (previousTexts.has(text)) {
        return null;
      }
      previousTexts.add(text);

      const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);

      console.log(`
        \rONENTER: ${traceTarget.name}
        \r${text}
        \rCallstack: ${callstack.splice(0, 8)}
        \rReturn: ${this.returnAddress}`);

      if (INSPECT_ARGS_REGS === true) {
        inspectArgs(args);
        inspectRegs(this.context);
      }
    },
  });
}

function setHookCharacterCount(name, text) {
  if (text === null || text === "") {
    return null;
  }

  const cleanedText = text.replace(/[。…、？！「」―ー・]|<[^>]+>|\r|\n|\u3000/gu, "");
  hooksStatus[name].characters += cleanedText.length;
}

// in case im being a dumbass
function validateHooks() {
  function expose(name, property) {
    throw new TypeError(`[${name}] ${property} is of type ${typeof property}`);
  }

  for (const hookName in hooks) {
    const hook = hooks[hookName];
    const { pattern, register, argIndex, target, origins, handler } = hook;

    if (typeof pattern !== "string") {
      expose(hookName, pattern);
    }
    if (typeof handler !== "function") {
      expose(hookName, handler);
    }
    if (register && argIndex) {
      expose(hookName, argIndex);
    }
    if (argIndex && !target && typeof argIndex !== "number") {
      expose(hookName, argIndex);
    }
    if (register && !target && typeof register !== "string") {
      expose(hookName, register);
    } else if (!register && target && typeof target !== "object") {
      expose(hookName, target);
    } else if (register && target && origins) {
      expose(hookName, origins);
    }
    if (!register && !target) {
      expose(hookName, target);
    }
  }
}

// https://stackoverflow.com/a/57100519
const color = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  FgGray: "\x1b[90m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
  BgGray: "\x1b[100m",
};

function logDim(message) {
  console.log(`${color.Dim}${message}${color.Reset}`);
}

//#endregion

//#region Start

async function start() {
  if (BACKTRACE === true) {
    return await startTrace();
  }

  validateHooks();
  await setupHooksAsync();
  // uiStart();
}

start()
  .then(() => {
    console.log("Script loaded");
  })
  .catch((err) => {
    console.error(err.stack);
  });

//#endregion
