// ==UserScript==
// @name         FINAL FANTASY XIII (ファイナルファンタジーXIII)
// @version      1.0.0
// @author       Mansive
// @description  Steam
// * Square Enix
// https://store.steampowered.com/app/292120/FINAL_FANTASY_XIII/
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
 * New InvocationContext with specified Ia32CpuContext because VSCode can't
 * perfectly resolve the generic CpuContext
 * @typedef {Omit<InvocationContext, "context"> & { context: Ia32CpuContext }} Ia32InvocationContext
 */

/**
 * @callback HookHandler
 * @this {Ia32InvocationContext}
 * @param {NativePointer} address
 * @returns {string | null=}
 */

//#endregion

//#region Some Globals

const __e = Process.enumerateModules()[0];

const BACKTRACE = true;
const DEBUG_LOGS = true;
const INSPECT_ARGS_REGS = false;

const SETTINGS = {
  singleSentence: true,
  // enableHooksName: true,
  // enableHooksTips: true,
  // enableHooksMenuExplanation: true,
  // enableHooksArcadeItems: true,
};

let hooksPrimaryCount = 0;
let hooksAuxCount = 0;

let timer1 = null;
let timer3 = null;

const encoder = new TextEncoder("shift_jis");
const decoder = new TextDecoder("shift_jis");

const texts1 = new Set();

const topTexts = new Set();
const middleTexts = new Set();
const bottomTexts = new Set();
const deepTexts = new Set();

let previous = "";

//#endregion

//#region Hooks

const hooksStatus = {
  // exampleHookName: { enabled: true, characters: 0 },
};

const returnAddresses = new Set();

// ASLR disabled
/** @type {Object.<string, TargetHook>} */
const targetHooks = {
  // ENCY: {
  //   name: "ENCY",
  //   pattern: "48 8B D8 48 85 C0 74 53 48 8B D0 48 89 74 24 30 48 8D 4F 08 E8",
  //   address: ptr(0x140303454),
  //   register: "rax",
  //   argIndex: -1,
  //   /** @type {TreasureContextFunction} */
  //   getTreasureAddress({ context }) {
  //     return context[this.register];
  //   },
  // },
  MYSTERY: {
    name: "MYSTERY",
    // pattern: "E8 0D 01 00 00 8B 45 E8 8B E5",
    pattern:
      "55 8B EC 81 EC D0 01 00 00 A1 84 5A 6E 02 33 C5 89 45 FC 89 8D 30 FE FF FF 83 7D 0C 00 75 07 C7 45 10 FF FF FF FF 8B 85 30 FE FF FF 8B 48 20",
    address: NULL,
    // register: "ecx", // message type
    register: "edx", // write buffer, nothings in it yet until onLeave()
    argIndex: -1,
    /** @type {TreasureContextFunction} */
    getTreasureAddress({ context }) {
      return context[this.register];
    },
    strategy: mysteryHookStrategy,
  },
};

//#region Hooks: Main

const hooksMain = {
  CutsceneDialogue: {
    pattern: "E8 A1 60 FC FF",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  DatalogEntry: {
    pattern: "E8 FB 1A 06 00",
    register: "edx",
    handler: positionMiddleHandler,
  },
  Popups: {
    pattern: "83 BC 10 B8 00 00 00 00 75 11 6A 01 68 24 9C 19 01 8D 4D DC",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  Popups1: {
    pattern: "E8 C0 80 F0 FF",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  Popups2: {
    pattern: "e8 b0 2b 00 00",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  DifficultySelection: {
    pattern: "E8 74 8A ED FF",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  LoadingChapter: {
    pattern: "E8 27 43 EE FF 8B 8D 90 FE FF FF 8B 51 74 52 68 10 8C 19 01",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  LoadingReview: {
    pattern: "E8 F3 42 EE FF 68 28 DF 09 01 8D 4D 88 E8 26 8D 9F FF",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  AreaName: {
    pattern: "E8 29 32 EE FF 8B 8D E0 FE FF FF 83 79 74 00 0F 84 AE 02 00 00",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  SideDialogue: {
    pattern: "E8 A3 B9 00 00 0F BF 55 FE 8B 45 F4 0F BE 0C 10",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  ShopSlidingMessage: {
    pattern:
      "E8 CE 5D F2 FF C6 85 D8 FB FF FF 00 0F BF 4D E6 03 4D DC 89 8D C4 FB FF FF 0F 84 F8 00 00 00",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  ShopItemDescription: {
    pattern: "E8 16 D6 F2 FF 8B 45 10 50 0F BF 4D DA",
    target: targetHooks.MYSTERY,
    handler: mainHandler,
  },
  MenuOptionDescription: {
    pattern: "E8 BB ED E9 FF",
    // pattern: "E8 6C 6F 0A 00",
    target: targetHooks.MYSTERY,
    handler: MenuOptionDescriptionHandler,
  },
};

//#endregion

//#region Hooks: Ency

const hooksEncyclopedia = {
  // EncyclopediaHelpInfo: {
  //   pattern: "48 89 5C 24 10 57 48 83 EC 20 48 8B F9 8B CA E8 7C 0E F3 FF", // above ency
  //   origins: [
  //     "49 8B 4C 24 28 33 D2 48 8B 01 FF 50 20 49 8B 8C 24 98 00 00 00 41 83 C9 FF 45 33 C0 48 8B 89 20 02 00 00 41 8D 51 02 E8 11 47 1B 00", // open help menu
  //     "48 8B 7C 24 38 33 C0 48 83 C4 20 5B C3 49 8B 8A 20 02 00 00 41 83 C9 FF 45 33 C0 33 D2 E8 6A 45 1B 00", // switch entry
  //     "48 8B 7C 24 38 33 C0 48 83 C4 20 5B C3 48 8B CB 89 BB A8 00 00 00 E8 EC F7 FF FF", // flip entry page
  //     // "39 BB AC 00 00 00 0F 8E A0 00 00 00", // flip menu page
  //   ],
  //   target: targetHooks.ENCY,
  //   handler: encyclopediaHelpInfoHandler,
  // },
};

//#endregion

//#region Hooks: All

// Combine all sets of hooks into one object for ease of use
/** @type {Object.<string, Hook>} */
const hooks = Object.assign({}, hooksMain);

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
 * Expects the address to be the function prologue.
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function filterReturnsStrategy({ address, name, register, handler }) {
  Breakpoint.add(address, function () {
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
  });
}

// The function is called twice, but we only want the second call.
// Only the first call have EAX and EDX equal to each other,
// so we can use that behavior to skip the first call.
// The beginning of the function stores the string's memory location in EDX,
// and EDX contains the completed string only after the function finishes.
function mysteryHookStrategy({ address, name, target, handler }) {
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

    const outerContext = this.context;

    let isDetached = false;
    const hook = Interceptor.attach(target.address, {
      onEnter(args) {
        if (this.context.eax.equals(this.context.edx)) {
          this.shouldSkip = true;
          return null;
        }
        this.outerContext = outerContext;
        this.edx = this.context.edx;
      },
      onLeave(retval) {
        if (this.shouldSkip) {
          return null;
        }

        hook.detach();
        isDetached = true;
        Interceptor.flush();

        console.log("onLeave: " + name);

        DEBUG_LOGS && console.log(hexdump(this.edx, { header: false, ansi: false, length: 0x100 }));

        const text = handler.call(this, this.edx) ?? null;
        setHookCharacterCount(name, text);
      },
    });

    // Manually detach in case onLeave never gets called
    setTimeout(() => {
      if (isDetached === false) {
        hook.detach();
        Interceptor.flush();
        DEBUG_LOGS && console.warn("Timeout: detached hook for " + name);
      }
    }, 10);
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
 * @param {Hook & {name: string} & {address: NativePointer}}
 */
function nestedHooksOnLeaveStrategy({ address, name, target, handler }) {
  Breakpoint.add(address, function () {
    const hook = Interceptor.attach(target.address, {
      onEnter(args) {
        console.log("onEnter: " + name);
        this.enterContext = this.context;
      },
      onLeave(retval) {
        hook.detach();
        Interceptor.flush();

        console.log("onLeave: " + name);
        // const text = handler(getTreasureAddress({ target, context: this.enterContext }));
        const text = handler(this.enterContext.edx);
        setHookCharacterCount(name, text);
      },
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
    const targetHookAddress = getPatternAddress(name, pattern);
    targetHooks[hook].address = targetHookAddress;
    hooksAuxCount += 1;
  }

  for (const hook in hooks) {
    const name = hook;
    const origins = hooks[hook].origins;

    if (origins) {
      for (const origin of origins) {
        const returnAddress = getPatternAddress(name + "RETURN", origin);
        returnAddresses.add(returnAddress.toUInt32());
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

  if (target?.strategy) {
    DEBUG_LOGS && console.log(`[${name}] using custom strategy`);
    target.strategy(args);
  } else if (origins && target) {
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

// https://github.com/LR-Research-Team/Datalog/wiki/ZTR
const encodingKeys = {
  singleByte: {
    "00": "{End}",
    "01": "{Escape}",
    "02": "{Italic}",
    "03": "{StraightLine}",
    "04": "{Article}",
    "05": "{ArticleMany}",
    ff: "{FF}",
  },
  icons: {
    f0_40: "{Icon Clock}",
    f0_41: "{Icon Warning}",
    f0_42: "{Icon Notification}",
    f0_43: "{Icon Gil}",
    f0_44: "{Icon Arrow_Right}",
    f0_45: "{Icon Arrow_Left}",
    f0_46: "{Icon Mission_Note}",
    f0_47: "{Icon Check_Mark}",
    f0_48: "{Icon Ability_Synthesized}",
    f2_40: "{Icon Gunblade}",
    f2_41: "{Icon Pistol}",
    f2_42: "{Icon Emblem}",
    f2_43: "{Icon Boomerang}",
    f2_44: "{Icon Staff}",
    f2_45: "{Icon Spear}",
    f2_46: "{Icon Knife}",
    f2_47: "{Icon Water_Drop}",
    f2_48: "{Icon Datalog}",
    f2_49: "{Icon Eidolith_Crystal}",
    f2_4a: "{Icon Omni_Kit}",
    f2_4b: "{Icon Shop_Pass}",
    f2_4c: "{Icon Synthetic_Component}",
    f2_4d: "{Icon Organic_Component}",
    f2_4e: "{Icon Catalyst_Component}",
    f2_4f: "{Icon Accessory_Type1}",
    f2_50: "{Icon Accessory_Type2}",
    f2_51: "{Icon Accessory_Type3}",
    f2_52: "{Icon Accessory_Type4}",
    f2_53: "{Icon Potion}",
    f2_54: "{Icon Container_Type1}",
    f2_55: "{Icon Container_Type2}",
    f2_56: "{Icon Phoenix_Down}",
    f2_57: "{Icon Shroud}",
    f2_58: "{Icon Sack}",
    f2_59: "{Icon Ability_Passive}",
    f2_5a: "{Icon Ability_Physical}",
    f2_5b: "{Icon Ability_Magic}",
    f2_5c: "{Icon Ability_Defense}",
    f2_5d: "{Icon Ability_Heal}",
    f2_5e: "{Icon Ability_Debuff}",
    f2_5f: "{Icon Status_Ailment}",
    f2_60: "{Icon Ability_Buff}",
    f2_61: "{Icon Alert}",
    f2_62: "{Icon Sword}",
    f2_63: "{Icon Shield}",
    f2_64: "{Icon Magic_Staff}",
    f2_65: "{Icon Unknown1}",
    f2_66: "{Icon Unknown2}",
    f2_67: "{Icon Unknown3}",
    f2_68: "{Icon Ability_Eidolon}",
    f2_69: "{Icon Ability_Technique}",
    f2_6a: "{Icon Ribbon}",
    f2_6b: "{Icon Amulet}",
    f2_6c: "{Icon Necklace}",
  },
  buttonPrompts: {
    f1_40: "{Btn A}",
    f1_41: "{Btn B}",
    f1_42: "{Btn X}",
    f1_43: "{Btn Y}",
    f1_44: "{Btn Start}",
    f1_45: "{Btn Back}",
    f1_46: "{Btn LB}",
    f1_47: "{Btn RB}",
    f1_48: "{Btn LT}",
    f1_49: "{Btn RT}",
    f1_4a: "{Btn DPadLeft}",
    f1_4b: "{Btn DPadDown}",
    f1_4c: "{Btn DPadRight}",
    f1_4d: "{Btn DPadUp}",
    f1_4e: "{Btn LSLeft}",
    f1_4f: "{Btn LSDown}",
    f1_50: "{Btn LSRight}",
    f1_51: "{Btn LSUp}",
    f1_52: "{Btn LSLeftRight}",
    f1_53: "{Btn LSUpDown}",
    f1_54: "{Btn LSPress}",
    f1_55: "{Btn RSPress}",
    f1_56: "{Btn RSLeft}",
    f1_57: "{Btn RSDown}",
    f1_58: "{Btn RSRight}",
    f1_59: "{Btn RSUp}",
    f1_5a: "{Btn RSLeftRight}",
    f1_5b: "{Btn RSUpDown}",
    f1_5c: "{Btn LStick}",
    f1_5d: "{Btn RStick}",
    f1_5e: "{Btn DPadUpDown}",
    f1_5f: "{Btn DPadLeftRight}",
    f1_60: "{Btn DPad}",
  },
  colors: {
    f9_32: "{Color Ex00}",
    f9_33: "{Color Ex01}",
    f9_34: "{Color Ex02}",
    f9_35: "{Color Ex03}",
    f9_36: "{Color Ex04}",
    f9_37: "{Color Ex05}",
    f9_38: "{Color Ex06}",
    f9_39: "{Color Ex07}",
    f9_3a: "{Color Ex08}",
    f9_3b: "{Color Ex09}",
    f9_3c: "{Color Ex10}",
    f9_3d: "{Color Ex11}",
    f9_3e: "{Color Ex12}",
    f9_3f: "{Color Ex13}",
    f9_40: "{Color White}",
    f9_41: "{Color IceBlue}",
    f9_42: "{Color Gold}",
    f9_43: "{Color LightRed}",
    f9_44: "{Color Yellow}",
    f9_45: "{Color Green}",
    f9_46: "{Color Gray}",
    f9_47: "{Color LightGold}",
    f9_48: "{Color Rose}",
    f9_49: "{Color Purple}",
    f9_4a: "{Color DarkYellow}",
    f9_4b: "{Color Gray2}",
    f9_4c: "{Color Voilet}",
    f9_4d: "{Color LightGreen}",
    f9_4f: "{Color Ex14}",
    f9_50: "{Color Ex15}",
    f9_51: "{Color Ex16}",
    f9_52: "{Color Ex17}",
    f9_53: "{Color Ex18}",
    f9_54: "{Color Ex19}",
    f9_55: "{Color Ex20}",
    f9_56: "{Color Ex21}",
    f9_57: "{Color Ex22}",
    f9_58: "{Color Ex23}",
    f9_59: "{Color Ex24}",
    f9_5a: "{Color Ex25}",
    f9_5b: "{Color Ex26}",
    f9_5e: "{Color Ex27}",
    f9_5f: "{Color Ex28}",
  },
  characters: {
    "85_40": "€",
    "85_42": "‚",
    "85_44": "„",
    "85_45": "…",
    "85_46": "†",
    "85_47": "‡",
    "85_49": "‰",
    "85_4a": "Š",
    "85_4b": "‹",
    "85_4c": "Œ",
    "85_4e": "Ž",
    "85_51": "‘",
    "85_52": "’",
    "85_53": "“",
    "85_54": "”",
    "85_55": "•",
    "85_56": "-",
    "85_57": "—",
    "85_59": "™",
    "85_5a": "š",
    "85_5b": "›",
    "85_5c": "œ",
    "85_5e": "ž",
    "85_5f": "Ÿ",
    "85_61": "¡",
    "85_62": "¢",
    "85_63": "£",
    "85_64": "¤",
    "85_65": "¥",
    "85_66": "¦",
    "85_67": "§",
    "85_68": "¨",
    "85_69": "©",
    "85_6a": "ª",
    "85_6b": "«",
    "85_6c": "¬",
    "85_6e": "®",
    "85_6f": "¯",
    "85_70": "°",
    "85_71": "±",
    "85_72": "²",
    "85_73": "³",
    "85_74": "´",
    "85_75": "µ",
    "85_76": "¶",
    "85_77": "·",
    "85_78": "¸",
    "85_79": "¹",
    "85_7a": "º",
    "85_7b": "»",
    "85_7c": "¼",
    "85_7d": "½",
    "85_7e": "¾",
    "85_7f": "¿",
    "85_9f": "À",
    "85_81": "Á",
    "85_82": "Â",
    "85_83": "Ã",
    "85_84": "Ä",
    "85_85": "Å",
    "85_86": "Æ",
    "85_87": "Ç",
    "85_88": "È",
    "85_89": "É",
    "85_8a": "Ê",
    "85_8b": "Ë",
    "85_8c": "Ì",
    "85_8d": "Í",
    "85_8e": "Î",
    "85_8f": "Ï",
    "85_90": "Ð",
    "85_91": "Ñ",
    "85_92": "Ò",
    "85_93": "Ó",
    "85_94": "Ô",
    "85_95": "Õ",
    "85_96": "Ö",
    "85_b6": "×",
    "85_98": "Ø",
    "85_99": "Ù",
    "85_9a": "Ú",
    "85_9b": "Û",
    "85_9c": "Ü",
    "85_9d": "Ý",
    "85_bd": "Þ",
    "85_be": "ß",
    "85_bf": "à",
    "85_c0": "á",
    "85_c1": "â",
    "85_c2": "ã",
    "85_c3": "ä",
    "85_c4": "å",
    "85_c5": "æ",
    "85_c6": "ç",
    "85_c7": "è",
    "85_c8": "é",
    "85_c9": "ê",
    "85_ca": "ë",
    "85_cb": "ì",
    "85_cc": "í",
    "85_cd": "î",
    "85_ce": "ï",
    "85_cf": "ð",
    "85_d0": "ñ",
    "85_d1": "ò",
    "85_d2": "ó",
    "85_d3": "ô",
    "85_d4": "õ",
    "85_d5": "ö",
    "85_d6": "÷",
    "85_d7": "ø",
    "85_d8": "ù",
    "85_d9": "ú",
    "85_da": "û",
    "85_db": "ü",
    "85_dc": "ý",
    "85_dd": "þ",
    "85_de": "ÿ",
  },
};

// encodingKeys is for human readability, while encodingKeys2 is for actual use
// keys as numbers avoids needing to convert hex to strings in readString()
const encodingKeys2 = new Map();
for (const category in encodingKeys) {
  for (const [key, value] of Object.entries(encodingKeys[category])) {
    let newKey;
    if (key.includes("_")) {
      const [hex1, hex2] = key.split("_");
      newKey = parseInt(hex1, 16) + parseInt(hex2, 16);
    } else {
      newKey = parseInt(key, 16);
    }
    encodingKeys2.set(newKey, value);
  }
}
for (const category in encodingKeys) {
  for (const [key, value] of Object.entries(encodingKeys[category])) {
    const [hex1, hex2] = key.split("_");
    const newKey = parseInt(hex1, 16) + parseInt(hex2, 16);
    encodingKeys2.set(newKey, value);
  }
}

// ev_comn_xxx -> cutscene dialogue with high-quality character models
// ev_hang -> cutscene dialogue without high-quality character models
// system -> system message

/** @param {NativePointer} address */
function readString(address) {
  let byte1 = 0;
  let byte2 = 0;
  let s = "";

  while (true) {
    byte1 = address.readU8();
    byte2 = address.add(1).readU8();

    // icons
    if (byte1 >= 0xf0 && byte1 <= 0xf2 && byte2 >= 0x40 && byte2 <= 0x70) {
      const controlCode = encodingKeys2.get(byte1 + byte2);
      if (!controlCode) {
        console.warn("Unknown control code:", byte1, byte2);
        s += `[${byte1} ${byte2}]`;
      } else {
        s += "▢"; // placeholder
      }
      address = address.add(2);
    }
    // colors
    else if (byte1 === 0xf9 && byte2 >= 0x32 && byte2 <= 0x5b) {
      const colorCode = encodingKeys2.get(byte1 + byte2);
      if (!colorCode) {
        console.warn("Unknown color code:", byte1, byte2);
        s += `[${byte1} ${byte2}]`;
      }
      address = address.add(2);
    }
    // special characters
    else if (byte1 === 0x85 && byte2 >= 0x40 && byte2 <= 0xde) {
      const specialChar = encodingKeys2.get(byte1 + byte2);
      if (!specialChar) {
        console.warn("Unknown special character:", byte1, byte2);
        s += `[${byte1} ${byte2}]`;
      } else {
        s += specialChar;
      }
      address = address.add(2);
    }
    // newline
    else if (byte1 === 0x40 && byte2 === 0x72) {
      s += "\n";
      address = address.add(2);
    }
    // choices
    else if (byte1 === 0x7c) {
      s += "\n";
      address = address.add(1);
    }
    // single byte key
    else if (byte1 >= 0x01 && byte1 <= 0x05) {
      console.warn("Single byte key:", encodingKeys2.get(byte1));
      address = address.add(1);
    }
    // null terminator
    else if (byte1 === 0x0) {
      // console.warn("Found null terminator");
      break;
    } else {
      const c = decoder.decode([byte1, byte2])[0];
      s += c;
      address = address.add(encoder.encode(c).byteLength);
    }
  }

  // $(t_dpad) -> 方向キー
  const text = s;

  DEBUG_LOGS &&
    !BACKTRACE &&
    console.log(`${colors.FgYellow}${JSON.stringify(text)}${colors.Reset}`);

  return text;
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

function orderedHandler() {
  clearTimeout(timer3);
  timer3 = setTimeout(() => {
    trans.send([...topTexts, ...middleTexts, ...bottomTexts, ...deepTexts].join("\n"));

    topTexts.clear();
    middleTexts.clear();
    bottomTexts.clear();
    deepTexts.clear();
  }, 600);
}

/**
 * @param {string} text
 * @param {Set<string>} set Positional text queue
 * @param {boolean} list Whether to append text to the list instead of overwriting
 */
function textSetControl(text, set, list = false) {
  if (list === false) {
    set.clear();
  }
  set.add(text);
}

/** @type {HookHandler & {list: boolean}} */
function positionTopHandler(address, list = false) {
  bottomTexts.clear();

  const text = readString(address);
  textSetControl(text, topTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionMiddleHandler(address, list = false) {
  bottomTexts.clear();

  const text = readString(address);
  textSetControl(text, middleTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionBottomHandler(address, list = false) {
  const text = readString(address);
  textSetControl(text, bottomTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionDeepHandler(address, list = false) {
  const text = readString(address);
  textSetControl(text, deepTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler} */
function mainHandler(address) {
  // console.log(hexdump(address, { header: false, ansi: false, length: 0x200 }));

  let text = readString(address);

  genericHandler(text);
  return text;
}

let menuOptionDescriptionPrevious = NULL;
/** @type {HookHandler} */
function MenuOptionDescriptionHandler(address) {
  /** @type {NativePointer} */
  const eax = this.outerContext.eax;

  if (eax.isNull()) {
    DEBUG_LOGS && console.warn("Skip null eax");
    return null;
  }

  const clue = eax.readShiftJisString();

  if (clue === "") {
    DEBUG_LOGS && console.warn("Skip empty clue");
    return null;
  }

  if (menuOptionDescriptionPrevious === clue) {
    DEBUG_LOGS && console.warn("Skip duplicate clue");
    return null;
  }
  menuOptionDescriptionPrevious = clue;

  if (clue.startsWith("$")) {
    return positionTopHandler(address);
  } else {
    return positionTopHandler(eax);
  }
}

trans.replace((/**@type {string}*/ s) => {
  // if (s === previous || s === "") {
  //   return null;
  // }
  // previous = s;

  // s = s.replace(/@r/g, "\n"); // 0x40 0x72

  return s.trim();
});

//#endregion

//#region Miscellaneous

const colors = {
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

function logText(message) {
  console.log(`${colors.FgYellow}${JSON.stringify(message)}${colors.Reset}`);
}

function logDim(message) {
  console.log(`${colors.Dim}${message}${colors.Reset}`);
}

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
      text = readString(args[i].readPointer());
    } catch (err) {
      try {
        type = "PP";
        text = readString(args[i].readPointer().readPointer());
      } catch (err) {
        try {
          type = "S";
          text = readString(args[i]);
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
    console.log(`${colors.BgMagenta}${text}${colors.Reset}`);
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
    "eax",
    "ebx",
    "ecx",
    "edx",
    "esi",
    "edi",
    "ebp",
    "esp",
    //"eip",
  ];

  let text = "";
  let address = NULL;

  for (const reg of regs) {
    address = context[reg];
    try {
      text = readString(address);
    } catch (err) {
      continue;
    }

    if (text === null || text.length === 0 || /^\\/g.test()) {
      continue;
    }

    regsTexts.push(`${reg}=${JSON.stringify(text)}`);
  }

  for (const text of regsTexts) {
    console.log(`${colors.BgBlue}${text}${colors.Reset}`);
  }
  regsTexts.length = 0;
}

/**
 * @param {NativePointer} relativeOffset
 * @returns {String}
 */
function createCallPattern(relativeOffset) {
  // 1. Convert the numeric offset to a hex string.
  let hexOperand = relativeOffset.toString(16);

  // 2. Pad with leading zeros to ensure it's 8 characters (4 bytes).
  // This is crucial for offsets smaller than 0x10000000.
  hexOperand = hexOperand.padStart(8, "0"); // e.g., "0027c3ad"

  // 3. Split the hex string into an array of byte pairs.
  const bytes = hexOperand.match(/../g);
  if (!bytes) {
    return "e8 00 00 00 00"; // Return a default or handle error
  }

  // 4. Reverse the byte order to create the little-endian pattern.
  const littleEndianPattern = bytes.reverse().join(" "); // e.g., "ad c3 27 00"

  // 5. Prepend the 'call' opcode (e8) and a space.
  const fullPattern = "e8 " + littleEndianPattern;

  return fullPattern;
}

/**
 * @param {Instruction} ins
 * @returns {NativePointer}
 */
function getCallRelativeOffset(ins) {
  if (ins.mnemonic !== "call") {
    // console.warn(`Instruction ${ins.address} is not a call`);
    return NULL;
  }

  const operand = ins.operands[0];
  if (operand.type !== "imm") {
    // console.warn("Call operand is not immediate");
    return NULL;
  }

  const insNext = ins.next;
  const functionAddress = ptr(operand.value);

  const relativeOffset = functionAddress.sub(insNext);

  return relativeOffset;
}

/** Prints the backtrace or callstack for a hook. */
function startTrace() {
  console.warn("Tracing!!");

  console.warn("Storing hooked addresses...");
  const hookedAddresses = new Set();
  for (const hook in hooks) {
    const hookInfo = hooks[hook];
    const address = getPatternAddress(hook, hookInfo.pattern);
    hookedAddresses.add(address.toUInt32());
  }

  const traceTarget = targetHooks.MYSTERY;

  const traceAddress = getPatternAddress(traceTarget.name, traceTarget.pattern);
  traceTarget.address = traceAddress;
  const previousTexts = new Set();
  const previousAddresses = new Set();

  Interceptor.attach(traceAddress, {
    onEnter(args) {
      this.edx = this.context.edx;

      //   const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);

      //   console.log(`
      //     \rONENTER: ${traceTarget.name}
      //     \rCallstack: ${callstack.splice(0, 8)}`);
    },
    onLeave(retval) {
      let text = "";
      try {
        text = readString(this.edx);
      } catch (err) {
        // console.error("Reading from address failed:", err.message);
        return null;
      }

      if (previousTexts.has(text)) {
        return null;
      }
      previousTexts.add(text);

      // first two are redundant
      const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE).splice(2, 8);
      const result = [];

      for (let i = 0; i < callstack.length; i++) {
        let color = "";
        const returnAddress = callstack[i];
        const callInsAddress = returnAddress.sub(0x5); // not quite right but good enough

        // Highlight if the call instruction is from a hooked function
        if (hookedAddresses.has(callInsAddress.toUInt32())) {
          color = colors.BgBlue;
        }

        const ins = Instruction.parse(callInsAddress);
        const offset = getCallRelativeOffset(ins);
        const returnAddressString = returnAddress.toString();
        const relations = ` ${i + 1}. ${callInsAddress.toString()}`;

        if (offset.isNull()) {
          result.push(relations);
        } else {
          const pattern = createCallPattern(offset);
          result.push(`${color}${relations} -> ${returnAddressString} - ${pattern}${colors.Reset}`);
        }
      }

      console.log(`ONLEAVE: ${traceTarget.name}
        \r${text}
        \rCallstack: \n${result.join("\r\n")}\n`);
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

//#endregion

//#region Start

function start() {
  if (BACKTRACE === true) {
    startTrace();
    return true;
  }

  validateHooks();
  setupHooks();
  // uiStart();
}

start();

//#endregion
