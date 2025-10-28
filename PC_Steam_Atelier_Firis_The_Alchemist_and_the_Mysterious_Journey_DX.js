// ==UserScript==
// @name         Atelier Firis: The Alchemist and the Mysterious Journey DX (フィリスのアトリエ ～不思議な旅の錬金術士～ DX)
// @version      1.02
// @author       Mansive
// @description  Steam
// * Gust
// * KOEI TECMO GAMES CO., LTD.
//
// https://store.steampowered.com/app/1502980/Atelier_Firis_The_Alchemist_and_the_Mysterious_Journey_DX/
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
 * @property {NativePointer} address
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
 * @callback HookHandler
 * @param {NativePointer} address
 * @returns {string | null=}
 */

//#endregion

//#region Some Globals

const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];

const BACKTRACE = false;

let INSPECT_ARGS_REGS = false;
let DEBUG_LOGS = false;

let convertToSingleLine = true;

let hooksPrimaryCount = 0;
let hooksAuxCount = 0;

let timer1 = null;
let timer2 = null;
let timer3 = null;

let previous = "";

/** @type {string[]} */
// event/MM01/EVENT_MESSAGE_MM01_010.ebm
const eventTexts = [];
let previousEventId = 0;
const encoder = new TextEncoder();

const texts1 = new Set();
const texts2 = new Set();

const priorityTexts = new Set();
let topText = "";
let middleText = "";
const bottomTexts = new Set();
let deepText = "";

const returnAddresses = new Set();

//#endregion

//#region Hooks

const hooksStatus = {
  // exampleHookName: { enabled: true, characters: 0 },
};

/** @type {Object.<string, TargetHook>} */
const targetHooks = {
  SHALLOW: {
    name: "SHALLOW",
    pattern: "48 89 5C 24 08 48 89 74 24 10 57 48 83 EC 20 33 F6 40 38 32",
    address: NULL,
    register: "rdx",
    argIndex: 1,
    /** @type {TreasureContextFunction} */
    getTreasureAddress({ context }) {
      return context[this.register];
    },
  },
  // trolled
  // ENCY: {
  //   name: "ENCY",
  //   pattern: "48 83 7B 40 10 48 8D 43 28",
  //   address: null,
  //   register: "rbx",
  //   argIndex: -1,
  //   /** @type {TreasureContextFunction} */
  //   getTreasureAddress({ context }) {
  //     return context[this.register].add(0x28).readPointer();
  //   },
  // },
  ENCY: {
    name: "ENCY",
    pattern: "48 8B D8 48 85 C0 74 53 48 8B D0 48 89 74 24 30 48 8D 4F 08 E8 13 4C D9 FF",
    address: NULL,
    register: "rax",
    argIndex: -1,
    /** @type {TreasureContextFunction} */
    getTreasureAddress({ context }) {
      return context[this.register];
    },
  },
  NUMBERS: {
    // <PCKEY030>, <IM00>, 5個
    name: "NUMBERS",
    pattern: "E8 0A010300", // after the giant conditionals
    address: NULL,
    register: "rsi",
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
    pattern: "E8 37E22A00",
    target: targetHooks.SHALLOW,
    handler: dialogueTextHandler,
  },
  DialogueText: {
    pattern: "E8 5A762300",
    register: "r8",
    handler: dialogueTextHandler,
  },
  EventText: {
    pattern: "8B 45 67 48 C7 45 F7 0F000000",
    register: "rdx",
    handler: eventTextHandler,
  },
  CenterText: {
    // Relies on EventText
    pattern: "E8 C1111000",
    register: "rdx",
    handler: centerTextHandler,
  },
};

//#endregion

//#region Hooks: Misc

const hooksMiscellaneous = {
  NotificationBanner: {
    pattern: "E8 197A1900",
    register: "rsi",
    handler: mainHandler2,
  },
  AreaNameBanner1: {
    // I forgot what banner this was for
    pattern: "E8 E3B50F00",
    target: targetHooks.SHALLOW,
    handler: mainHandler2,
  },
  AreaNameBanner2: {
    pattern: "E8 421F0800",
    register: "rsi",
    handler: mainHandler2,
  },
  SideDialogue: {
    pattern: "E8 B9FA0B00",
    target: targetHooks.SHALLOW,
    handler: mainHandler2,
  },
  StatusSkillName: {
    pattern: "E8 8126F8FF",
    register: "rdx",
    handler: positionPriorityHandler,
  },
  StatusSkillInfo: {
    pattern: "48 83 C4 20 5F C3 48 8D 0D 8C",
    register: "r10",
    handler: positionMiddleSingleHandler,
  },
  QuestName: {
    pattern: "E8 6B431800",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  QuestIncompleteInfo: {
    pattern: "E8 BE3D1800",
    target: targetHooks.SHALLOW,
    handler: positionMiddleSingleHandler,
  },
  QuestCompleteInfo: {
    pattern: "E8 E53D1800",
    target: targetHooks.SHALLOW,
    handler: positionMiddleSingleHandler,
  },
  QuestObjective: {
    pattern: "E8 AF531800",
    register: "rdx",
    // argIndex: 1,
    // target: hotHooks.SHALLOW,
    handler: questObjectiveHandler,
  },
  OutfitOverviewInfo: {
    pattern: "E8 DFE82800",
    target: targetHooks.SHALLOW,
    handler: positionMiddleSingleHandler,
  },
  OutfitEffectInfo: {
    pattern: "E8 37EA2800",
    target: targetHooks.SHALLOW,
    handler: positionMiddleSingleHandler,
  },
  FurnitureEffect: {
    pattern: "E8 D9422E00",
    target: targetHooks.ENCY,
    handler: positionMiddleHandler,
  },
  FurnitureTrait: {
    pattern: "E8 74412E00",
    target: targetHooks.ENCY,
    handler: furnitureTraitHandler,
  },
  KenbuninAchievement: {
    pattern: "E8 B4C31800",
    register: "rdx",
    handler: mainHandler2,
  },
  KenbuninItemReward: {
    pattern: "E8 A8C61800",
    register: "rdx",
    handler: mainHandler2,
  },
  KenbuninMoneyReward: {
    pattern: "E8 2BC61800",
    register: "rdx",
    handler: mainHandler2,
  },
  Question: {
    pattern: "E8 1EEF2E00",
    target: targetHooks.SHALLOW,
    handler: mainHandler2,
  },
  Answer: {
    pattern: "E8 AAEE2E00",
    target: targetHooks.SHALLOW,
    handler: mainHandler2,
  },
  ExtraMusicName: {
    pattern: "E8 7B57F9FF",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  ExtraMusicDescription: {
    pattern: "E8 1057F9FF",
    target: targetHooks.SHALLOW,
    handler: positionMiddleSingleHandler,
  },
};

//#endregion

//#region Hooks: Battle

const hooksBattle = {
  BattleEnemyName: {
    pattern: "E8 F06CFBFF",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  BattleAction: {
    pattern: "E8 51E4CCFF",
    register: "rax",
    handler: positionTopHandler,
  },
  BattleActionAllySpecial: {
    pattern: "E8 4CFDFFFF 48 83 7C 24 60 10",
    // argIndex: 1,
    register: "rdx",
    handler: mainHandler2,
  },
  BattleActionEnemySpecial: {
    pattern: "E8 BCEFFFFF 48 83 7C 24 60 10",
    // argIndex: 1,
    register: "rdx",
    handler: mainHandler2,
  },
  BattleSkillName: {
    pattern: "E8 F452FBFF",
    target: targetHooks.SHALLOW,
    handler: positionPriorityHandler,
  },
  BattleSkillInfo1: {
    pattern: "E8 E7CDF3FF 48 8B 4F 08",
    target: targetHooks.SHALLOW,
    handler: positionMiddleSingleHandler,
  },
  BattleSkillInfo2: {
    pattern: "E8 365DFBFF",
    // argIndex: 1,
    register: "rdx",
    handler: positionBottomHandler,
  },
  BattleEnemyStatusInfo: {
    pattern: "E8 667DFBFF",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
};

//#endregion

//#region Hooks: Synth

const hooksSynthesis = {
  RecipeHassouName: {
    pattern: "E8 DAD41600",
    target: targetHooks.SHALLOW,
    handler: mainHandler2,
  },
  RecipeNoteName: {
    // Requires RecipeNoteHint to be enabled to avoid spoiling names
    pattern: "E8 27F31600",
    target: targetHooks.ENCY,
    handler: recipeNoteNameHandler,
  },
  RecipeNoteHint: {
    pattern: "E8 7EEE1600",
    target: targetHooks.SHALLOW,
    // handler: scrollHandlerBottom,
    handler: recipeNoteHintHandler,
  },
  RecipeNoteObjective: {
    pattern: "E8 A591E8FF",
    // register: "r8", // %d appearing
    target: targetHooks.NUMBERS,
    handler: positionBottomHandler,
  },
  RecipeNoteCatalyst: {
    pattern: "E8 D5F61600",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  RecipeNoteMaterial1: {
    // category
    pattern: "E8 2EF61600",
    target: targetHooks.ENCY,
    handler: positionBottomHandler,
  },
  RecipeNoteMaterial2: {
    // specific item
    pattern: "E8 02F61600",
    target: targetHooks.ENCY,
    handler: positionBottomHandler,
  },
  RecipeSynthesisName: {
    pattern: "E8 B8681900",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  RecipeSynthesisCatalyst: {
    pattern: "E8 FB6E1900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  RecipeSynthesisMaterial1: {
    pattern: "E8 F66D1900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  RecipeSynthesisMaterial2: {
    pattern: "E8 BC6D1900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  RecipeJukurendoInfo: {
    pattern: "E8 04721900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  ItemName: {
    pattern: "E8 37D50900",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  ItemEffect: {
    pattern: "E8 BED20900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  ItemEffectExplanation: {
    pattern: "E8 CE1F2D00",
    target: targetHooks.SHALLOW,
    handler: positionDeepHandler,
  },
  ItemTrait: {
    pattern: "E8 06D20900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  ItemTraitTransfer: {
    pattern: "E8 E6020F00",
    target: targetHooks.SHALLOW,
    handler: positionMiddleHandler,
  },
  ItemComponent: {
    pattern: "E8 07CE0900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  ItemCategory: {
    pattern: "E8 92CD0900",
    target: targetHooks.SHALLOW,
    handler: positionBottomHandler,
  },
  SynthesisLineInfo: {
    pattern: "E8 D6380000 48 8B 5B 20",
    target: targetHooks.SHALLOW,
    handler: positionMiddleHandler,
  },
};

//#endregion

//#region Hooks: Ency

const hooksEncyclopedia = {
  EncyclopediaItemName: {
    pattern: "E8 E4EB2D00",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  EncyclopediaEnemyName: {
    pattern: "E8 E1882D00",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  EncyclopediaAreaName: {
    pattern: "E8 26B12D00",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  EncyclopediaDialogue: {
    pattern: "E8 E1B42400",
    target: targetHooks.SHALLOW,
    handler: encyclopediaDialogueHandler,
  },
  EncyclopediaHelpName: {
    pattern: "E8 570C2E00",
    target: targetHooks.ENCY,
    handler: positionTopHandler,
  },
  EncyclopediaHelpInfo: {
    pattern: "48 89 5C 24 10 57 48 83 EC 20 48 8B F9 8B CA E8 5C 47 F3 FF",
    origins: [
      "48 8B 4E 28 33 D2 48 8B 01 FF 50 20", // open help menu
      "48 8B 7C 24 38 33 C0 48 83 C4 20 5B C3 49", // switch entry
      "48 8B 7C 24 38 33 C0 48 83 C4 20 5B C3 48 8B CB", // flip entry page
      "39 BB AC 00 00 00 0F 8E A0 00 00 00", // flip menu page
    ],
    target: targetHooks.ENCY,
    handler: encyclopediaHelpInfoHandler,
  },
  EncyclopediaEffectName: {
    pattern: "E8 7A302C00",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  EncyclopediaEffectInfo: {
    pattern: "E8 60302C00",
    target: targetHooks.SHALLOW,
    handler: positionMiddleHandler,
  },
  EncyclopediaTraitName: {
    pattern: "E8 91202C00",
    target: targetHooks.SHALLOW,
    handler: positionTopHandler,
  },
  EncyclopediaTraitInfo: {
    pattern: "E8 77202C00",
    target: targetHooks.SHALLOW,
    handler: positionMiddleHandler,
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
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function filterReturnsStrategy({ address, name, register, handler }) {
  Breakpoint.add(address, {
    onEnter() {
      const returnAddress = this.context.rsp.readPointer();
      // console.warn("filtering: " + returnAddress);

      if (returnAddresses.has(returnAddress.toInt32())) {
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
      } else {
        // console.warn(`Current return address: ${this.returnAddress}
        // \rreturnAddresses Set: ${JSON.stringify(returnAddresses)}`);
      }
    },
  });
}

/**
 * Hooks an address as the origin, then temporarily hooks a target address
 * whenever the origin is accessed.
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function nestedHooksStrategy({ address, name, target, handler }) {
  Breakpoint.add(address, {
    onEnter() {
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
    },
  });
}

/**
 * Combination of {@link nestedHooksStrategy} and {@link filterReturnsStrategy}.
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function filterReturnsNestedHooksStrategy({ address, name, target, handler }) {
  Breakpoint.add(address, {
    onEnter() {
      const returnAddress = this.context.rsp.readPointer();
      // console.warn("filtering: " + returnAddress);

      if (returnAddresses.has(returnAddress.toInt32())) {
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
      } else {
        // ...
      }
    },
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
 * Scans a pattern in memory and returns a NativePointer for first match.
 * @param {string} name
 * @param {string} pattern
 * @returns {NativePointer}
 */
function getPatternAddress(name, pattern) {
  let results = "";

  try {
    results = Memory.scanSync(__e.base, __e.size, pattern);
  } catch (err) {
    throw new Error(`Error ocurred with [${name}]: ${err.message}`, {
      cause: err,
    });
  }

  if (results.length === 0) {
    throw new Error(`[${name}] Not found!`);
  }

  const address = results[0].address;

  console.log(`\x1b[32m[${name}] @ ${address}\x1b[0m`);
  if (results.length > 1) {
    console.warn(`${name} has ${results.length} results`);
    // console.log(results[0].address, results[1].address);
  }

  return address;
}

function setupHooks() {
  for (const hook in targetHooks) {
    const name = hook;
    const pattern = targetHooks[name].pattern;
    targetHooks[hook].address = getPatternAddress(name, pattern);
    hooksAuxCount += 1;
  }

  for (const hook in hooks) {
    const name = hook;
    const origins = hooks[hook].origins;

    if (origins) {
      for (const origin of origins) {
        returnAddresses.add(getPatternAddress(name + "RETURN", origin).toUInt32());
        hooksAuxCount += 1;
      }
    }

    const result = attachHook({ name, ...hooks[hook] });

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

/**
 * In order from least to greatest priority:\
 * If {@link target} is provided, the hook will use it.\
 * If {@link origins} is provided, return addresses will filter the hook.
 * @param {Hook & {name: string}} params
 * @returns {boolean}
 */
function attachHook(params) {
  const { name, pattern, target, origins } = params;
  const address = getPatternAddress(name, pattern);
  const args = { address, ...params };

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

function readFirisString(address) {
  const textAddress = address.readUtf8String();

  DEBUG_LOGS && console.log(`${color.FgYellow}${JSON.stringify(textAddress)}${color.Reset}`);

  return textAddress;
}

/** @param {string} text */
function genericHandler(text) {
  texts1.add(text);

  clearTimeout(timer1);
  timer1 = setTimeout(() => {
    trans.send([...texts1].join("\r\n"));
    texts1.clear();
  }, 200);
}

/** @param {string} text */
function genericHandler2(text) {
  texts2.add(text);

  clearTimeout(timer2);
  timer2 = setTimeout(() => {
    trans.send([...texts2].join("\r\n"));
    texts2.clear();
  }, 250);
}

function orderedHandler() {
  clearTimeout(timer3);
  timer3 = setTimeout(() => {
    trans.send(
      [...priorityTexts].join("\r\n") +
        "\r\n" +
        topText +
        middleText +
        [...bottomTexts].join("\r\n") +
        "\r\n" +
        deepText
    );

    priorityTexts.clear();
    topText = "";
    middleText = "";
    bottomTexts.clear();
    deepText = "";
  }, 600);
}

// Lazy check, not sure how to check the timer itself...
function orderedHandlerIsActive() {
  return (
    priorityTexts.size > 0 ||
    topText !== "" ||
    middleText !== "" ||
    bottomTexts.size > 0 ||
    deepText !== ""
  );
}

/** @type {HookHandler} */
function positionMiddleHandler(address) {
  bottomTexts.clear();

  const text = readFirisString(address);

  middleText = text + "\r\n";

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function positionMiddleSingleHandler(address) {
  bottomTexts.clear();

  let text = readFirisString(address);

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！）])<CR>/g, "$1");
  }

  middleText = text + "\r\n";

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function positionTopHandler(address) {
  bottomTexts.clear();

  const text = readFirisString(address);

  topText = text + "\r\n";

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function positionBottomHandler(address) {
  const text = readFirisString(address);

  bottomTexts.add(text);

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function positionPriorityHandler(address) {
  const text = readFirisString(address);

  priorityTexts.add(text);

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function positionDeepHandler(address) {
  const text = readFirisString(address);

  deepText = text;

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function mainHandler(address) {
  let text = readFirisString(address);

  if (convertToSingleLine === true) {
    // text = text.replace(/([^。…？！])<CR>/g, "$1");
    text = text.replace(/(?![^：]+：)([^。…？！])<CR>/g, "$1");
  }

  genericHandler(text);
  return text;
}

/** @type {HookHandler} */
function mainHandler2(address) {
  const text = readFirisString(address);

  genericHandler(text);
  return text;
}

/**
 * Moves text to the top of the ordered output, otherwise handles text normally.
 * For cases where text from important hooks end up at the bottom of output
 * due to being called late, but still need the behavior of {@link genericHandler}.
 * @type {HookHandler}
 */
function dialogueTextHandler(address) {
  let text = readFirisString(address);

  if (convertToSingleLine === true) {
    // text = text.replace(/([^。…？！])<CR>/g, "$1");
    text = text.replace(/(?![^：]+：)([^。…？！])<CR>/g, "$1");
  }

  if (orderedHandlerIsActive() === true) {
    DEBUG_LOGS && console.warn("Expediting...");
    priorityTexts.add(text);
    orderedHandler();
  } else {
    genericHandler(text);
  }

  // Align the array for CenterText hook
  eventTexts.shift();

  return text;
}

/**
 * Called for each event. The game loads every text an event needs, all of which
 * will be stored by this handler. Other handlers will use the stored text.
 * @type {HookHandler}
 */
function eventTextHandler(address) {
  if (address.readU8() === previousEventId) {
    DEBUG_LOGS && console.log("Same ID, skipping...");
    return null;
  }

  // console.log(hexdump(address, { header: false, ansi: false, length: 0x500 }));

  previousEventId = address.readU8();
  eventTexts.length = 0; // clear text from previous event
  address = address.add(4); // jump to opcode

  DEBUG_LOGS && console.warn("Processing event...");

  parseEvent: while (true) {
    const opcode = address.readU8();
    switch (opcode) {
      // new paragraph
      case 0x2:
        address = address.add(36); // jump to string

        const text = readFirisString(address);

        // Prevent possible duplicates
        if (eventTexts.at(-1) !== text) {
          eventTexts.push(text);
        }

        const textLength = encoder.encode(text).byteLength;
        address = address.add(textLength + 1); // jump to opcode
        continue;

      // new paragraph (in tutorial?)
      case 0x3:
      // end
      case 0xcd:
        break parseEvent;
      default:
        DEBUG_LOGS && console.warn("Undefined opcode: ", opcode);
        // console.warn(address.readByteArray(50));
        break parseEvent;
    }
  }

  return null;
}

/**
 * Consume stored texts from {@link eventTexts}.
 * @type {HookHandler}
 */
function centerTextHandler(address) {
  const id = readFirisString(address);

  if (id.startsWith("telop")) {
    DEBUG_LOGS && console.log("Is Paragraph");
  } else if (id.startsWith("name")) {
    DEBUG_LOGS && console.log("Is Name");
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
    text = text.replace(/([^。…？！])<CR>/g, "$1");
  }

  genericHandler(text);
  return text;
}

/** @type {HookHandler} */
function questObjectiveHandler(address) {
  let text = readFirisString(address);

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！）])<CR>\u3000/gu, "$1");
  }

  bottomTexts.add("\r\n" + text);

  orderedHandler();
  return text;
}

/**
 * Call order starting from the earliest:
 * 1. FurnitureEffect
 * 2. FurnitureTrait (multiple)
 * 3. ItemName
 *
 * Appends to {@link middleText} which gets cleared whenever FurnitureEffect is
 * called.
 * @type {HookHandler}
 */
function furnitureTraitHandler(address) {
  const text = readFirisString(address);

  middleText += "\r\n" + text;

  orderedHandler();
  return text;
}

/**
 * Wraps around {@link positionTopHandler} and clears {@link middleText} to
 * avoid an issue where RecipeNoteHint spills into known recipe output.
 * @type {HookHandler}
 */
function recipeNoteNameHandler(address) {
  const text = positionTopHandler(address);

  middleText = "";

  return text;
}

/**
 * If this handler is called, it means the name of the recipe should be unknown.\
 * Handles RecipeNoteHint while also replacing {@link topText} with question
 * marks to match in-game view.
 * @type {HookHandler}
 */
function recipeNoteHintHandler(address) {
  DEBUG_LOGS && console.log("[RecipeNoteHintHandler] Intercepted!");
  topText = "？？？？？\r\n";

  let text = readFirisString(address);

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！）])<CR>/g, "$1");
  }

  // bottomTexts.add(text);
  middleText = text + "\r\n";

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function encyclopediaDialogueHandler(address) {
  bottomTexts.clear();

  let text = readFirisString(address);

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！）])<CR>\u3000/gu, "$1");
  }

  middleText = text + "\r\n";

  orderedHandler();
  return text;
}

/** @type {HookHandler} */
function encyclopediaHelpInfoHandler(address) {
  let text = readFirisString(address);

  // turn subheadings into newlines
  text = text.replace(/([^、])<CR><CLGR>|<CLNR><CR>/g, "$1\r\n");

  if (convertToSingleLine === true) {
    text = text.replace(/([^。…？！])<CR>/g, "$1");
  }

  middleText = text + "\r\n";

  orderedHandler();
  return text;
}

trans.replace((s) => {
  if (s === previous || s === "") {
    return null;
  }
  previous = s;

  return s
    .replace(/<CR>/g, "\r\n") // replace with actual newline
    .replace(/<IM\d+>/g, "▢") // supposed to be a button on controller/keyboard
    .replace(/<[^>]+>/g, "") // deal with everything else
    .trim();
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
function startTrace() {
  console.warn("Tracing!!");

  const traceTarget = targetHooks.SHALLOW;

  const traceAddress = getPatternAddress(traceTarget.name, traceTarget.pattern);
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
        console.error("Reading from address failed:", err.message);
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

//#region UI Config

// Now that I removed the ability to enable/disable individual hooks, I can clean
// up the script by passing in arrays into the UI options instead of hardcoded
// values like in the Atelier Sophie script
function getHookOptions(subset) {
  const options = [];
  for (const hookName in subset) {
    options.push({ value: hookName, text: hookName });
  }

  return options;
}

// Hacky way to avoid libUI bug?
function getEnabledCount() {
  let enabledCount = 0;
  for (const thing in hooksStatus) {
    if (hooksStatus[thing].enabled === true) {
      enabledCount++;
    }
  }

  return enabledCount;
}

// getHookOptions();

ui.title = "Atelier Firis";
ui.description = /*html*/ `
<small class='text-muted'>Game Version: <code>1.02</code></small>
<br>Configure text output and which hooks are enabled.
<br>Check Agent's console output to see each text's corresponding hook.
`;

// ui.storage = false;

//prettier-ignore
ui.options = [
  {
    id: "singleSentence",
    type: "checkbox",
    label: "Single-line sentences",
    help: `Attempt to convert sentences that span multiple lines into a single line.
    Useful for external apps that need to parse sentences.
    Disable if you want to retain the text's original formatting.`,
    defaultValue: true,
  },
  {
    id: "enableHooksName",
    type: "checkbox",
    label: "Enable DialogueName Hook",
    help: `Enable the main dialogue's name hook.`,
    defaultValue: true
  },
  {
    id: "enableHooksMiscellaneous",
    type: "checkbox",
    label: "Enable Miscellaneous Hooks",
    defaultValue: true
  },
  {
    id: "enableHooksBattle",
    type: "checkbox",
    label: "Enable Battle Hooks",
    defaultValue: true
  },
  {
    id: "enableHooksSynthesis",
    type: "checkbox",
    label: "Enable Synthesis Hooks",
    defaultValue: true
  },
  {
    id: "enableHooksEncyclopedia",
    type: "checkbox",
    label: "Enable Encyclopedia Hooks",
    defaultValue: true
  },
  {
    id: "hooksEnabledCount",
    type: "text",
    label: "Number of hooks enabled",
    readOnly: true,
    defaultValue: "0",
    ephemeral: true,
  },
  {
    id: "selectedHook",
    type: "select",
    label: "Display character count from...",
    help: "Select a hook to display its character count.",
    options: getHookOptions(hooks).sort((a, b) => a.value.localeCompare(b.text)),
    defaultValue: "DialogueText",
  },
  {
    id: "selectedHookCharacterCount",
    type: "number",
    label: "Character count for selected hook",
    help: `Displays the total number of characters outputted by the selected hook.
    <br>Resets with each session.`,
    readOnly: true,
    defaultValue: 0,
    ephemeral: true,
  },
  {
    id: "hooksMain",
    type: "select",
    label: "Main Hooks",
    help: `Dialogue during cutscenes and choices.
    <br>Only the DialogueName hook can be enabled/disabled.`,
    multiple: true,
    options: getHookOptions(hooksMain),
    ephemeral: true,
  },
  {
    id: "hooksMiscellaneous",
    type: "select",
    label: "Miscellaneous Hooks",
    help: `Trivial text while exploring, quest objectives, menu text, etc.`,
    multiple: true,
    options: getHookOptions(hooksMiscellaneous),
    ephemeral: true,
  },
  {
    id: "hooksBattle",
    type: "select",
    label: "Battle Hooks",
    help: `Text or notifications appearing in battle.`,
    multiple: true,
    options: getHookOptions(hooksBattle),
    ephemeral: true,
  },
  {
    id: "hooksSynthesis",
    type: "select",
    label: "Synthesis Hooks",
    help: `Synthesis-relevant text such as recipe info and item traits.`,
    multiple: true,
    options: getHookOptions(hooksSynthesis),
    ephemeral: true,
  },
  {
    id: "hooksEncyclopedia",
    type: "select",
    label: "Encyclopedia Hooks",
    help: `Encyclopedia entries' texts.`,
    multiple: true,
    options: getHookOptions(hooksEncyclopedia),
    ephemeral: true,
  },
  {
    id: "debugLogs",
    type: "checkbox",
    label: "Show debugging information in console",
    defaultValue: false
  },
];

ui.onchange = (id, current, previous) => {
  if (id.startsWith("enableHooks") === true) {
    if (id === "enableHooksName") {
      hooksStatus["DialogueName"].enabled = current;
    } else {
      let subset = {};

      if (id === "enableHooksMiscellaneous") {
        subset = hooksMiscellaneous;
      } else if (id === "enableHooksBattle") {
        subset = hooksBattle;
      } else if (id === "enableHooksSynthesis") {
        subset = hooksSynthesis;
      } else if (id === "enableHooksEncyclopedia") {
        subset = hooksEncyclopedia;
      } else {
        console.error("Unknown id", id);
      }

      for (const hookName in subset) {
        hooksStatus[hookName].enabled = current;
      }
    }

    logDim(`UI: ${id} set to ${current}`);
    ui.config.hooksEnabledCount = `${getEnabledCount()} / ${hooksPrimaryTotal}`;
  } else if (id === "selectedHook") {
    logDim(`UI: Now displaying character count of [${current}]`);
    ui.config.selectedHookCharacterCount = hooksStatus[current].characters;
  } else if (id === "singleSentence") {
    current === true
      ? logDim("UI: Converting sentences to single-line")
      : logDim("UI: Maintaining sentences' original format");
    convertToSingleLine = current;
  } else if (id === "debugLogs") {
    current === true
      ? logDim("UI: Enabling debug information")
      : logDim("UI: Disabling debug information");
    INSPECT_ARGS_REGS = current;
    DEBUG_LOGS = current;
  }
};

function uiStart() {
  // Update character count every 5 seconds
  setInterval(() => {
    ui.config.selectedHookCharacterCount = hooksStatus[ui.config.selectedHook].characters;
  }, 5000);

  ui.open()
    .then(() => {
      ui.config.hooksEnabledCount = `${getEnabledCount()} / ${hooksPrimaryTotal}`;
      console.log("UI: UI loaded!");
    })
    .catch((err) => {
      console.error("UI error\n" + err.stack);
    });
}

//#endregion

//#region Start

function start() {
  if (BACKTRACE === true) {
    startTrace();
    return true;
  }

  validateHooks();
  setupHooks();
  uiStart();
}

start();

//#endregion
