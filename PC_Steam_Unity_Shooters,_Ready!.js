// ==UserScript==
// @name         Shooters, Ready! (シューターズ レディ！)
// @version      1.0.2
// @author       Mansive
// @description  Steam
// * おこめたべたべず
// https://store.steampowered.com/app/3247500/Shooters_Ready/
// ==/UserScript==

//#region Types

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

//#region Config

const ui = require("./libUI.js");
const Mono = require("./libMono.js");

const DEBUG_LOGS = true;

const SETTINGS = {
  singleSentence: true,
  enableHooksName: true,
  enableHooksTips: true,
  enableHooksMenuExplanation: true,
  enableHooksArcadeItems: true,
};

//#endregion

//#region Miscellaneous

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

function logText(message) {
  console.log(`${color.FgYellow}${JSON.stringify(message)}${color.Reset}`);
}

function logDim(message) {
  console.log(`${color.Dim}${message}${color.Reset}`);
}

//#endregion

//#region Handlers

let timer1 = null;
let timer3 = null;

const texts1 = new Set();

const topTexts = new Set();
const middleTexts = new Set();
const bottomTexts = new Set();
const deepTexts = new Set();

/** @param {NativePointer} address */
function readString(address) {
  const text = address.readMonoString();

  DEBUG_LOGS && logText(text);

  return text;
}

const handler = genericHandler;

/** @param {string} text */
function genericHandler(text, delay = 200) {
  texts1.add(text);

  clearTimeout(timer1);
  timer1 = setTimeout(() => {
    trans.send([...texts1].join("\r\n"));
    texts1.clear();
  }, delay);
}

function orderedHandler() {
  clearTimeout(timer3);
  timer3 = setTimeout(() => {
    trans.send([...topTexts, ...middleTexts, ...bottomTexts, ...deepTexts].join("\r\n"));

    topTexts.clear();
    middleTexts.clear();
    bottomTexts.clear();
    deepTexts.clear();
  }, 300);
}

/**
 * @param {string} text
 * @param {Set<string>} set
 * @param {boolean} list
 */
function textSetControl(text, set, list = false) {
  if (list === false) {
    set.clear();
  }
  set.add(text);
}

/** @type {HookHandler & {list: boolean}} */
function positionMiddleHandler(text, list = false) {
  bottomTexts.clear();

  textSetControl(text, middleTexts, list);
  orderedHandler();

  return text;
}

//#endregion

//#region Wasteland

/**
 * @param {string} displayName Descriptive name for the hook
 * @param {string} imageName
 * @param {string} className
 * @param {string} methodName
 * @param {number} argCount
 * @param {Mono.InvocationListenerCallbacksMono|Mono.InstructionProbeCallbackMono} callbacks
 * @returns {InvocationListener}
 */
function setHook(displayName, imageName, className, methodName, argCount, callbacks) {
  const callbacksWrapper = {};
  const name = `${displayName} (${className}.${methodName})`.trimStart();

  if (callbacks.onEnter instanceof Function === true) {
    callbacksWrapper.onEnter = function (args) {
      console.log(`onEnter: ${name}`);
      callbacks.onEnter(args);
    };
  }
  if (callbacks.onLeave instanceof Function === true) {
    callbacksWrapper.onLeave = function (retval) {
      console.log(`onLeave: ${name}`);
      callbacks.onLeave(retval);
    };
  }

  return Mono.setHook(imageName, className, methodName, argCount, callbacksWrapper);
}

// setHook("", "", "UIControlGuide", "SetText", -1, {
//   onEnter(args) {
//     const text = readString(args[1]);
//     handler(text);
//   },
// });

setHook("Dialogue", "", "UIStory", "NextMessage", -1, {
  onEnter(args) {
    const result = [];
    const name = readString(args[1]);
    let message = readString(args[2]);

    if (SETTINGS.enableHooksName) {
      result.push(name);
    }

    if (SETTINGS.singleSentence) {
      message = message.replace(/\r\n\u{3000}?/gu, "　");
    }

    message = message.replace();
    result.push(message);

    handler(result.join("\r\n"));
  },
});

setHook("Telop", "", "UIStory", "TelopIn", -1, {
  onEnter(args) {
    const telop = readString(args[1]);
    handler(telop);
  },
});

setHook("Tips", "", "UIPauseMenu", "StartPause", -1, {
  onEnter(args) {
    if (!SETTINGS.enableHooksTips) {
      logDim("Skipped!");
      return null;
    }

    this.thiz = args[0].wrap();
  },
  onLeave() {
    if (!SETTINGS.enableHooksTips) {
      logDim("Skipped!");
      return null;
    }

    /** @type {Mono.MonoObjectWrapper} */
    const thiz = this.thiz;
    const textComponent = thiz.tipsMessageObj_.wrap().GetComponentByName("Text").wrap();
    const text = readString(textComponent.text);
    handler(text);
  },
});

setHook("Tutorial Message", "", "UITutorialMessage", "NextMessage", -1, {
  onEnter(args) {
    // const name = readString(args[1]); // "TutorialStory"
    let message = readString(args[2]);

    if (SETTINGS.singleSentence) {
      message = message.replace(/\r\n\u{3000}?/gu, "　");
    }

    handler(message);
  },
});

setHook("Menu Explanation", "", "UIMenu00", "ExplainTextIn", -1, {
  onEnter(args) {
    if (!SETTINGS.enableHooksMenuExplanation) {
      logDim("Skipped!");
      return null;
    }

    const explain = readString(args[1]);
    positionMiddleHandler(explain);
  },
});

// setHook("", "", "UIOption", "ExplainTextIn", -1, {
//   onEnter(args) {
//     const explain = readString(args[1]);
//     positionMiddleHandler(explain);
//   },
// });

setHook("Arcade Item", "", "UIBuyButtonBase", "Start", -1, {
  onEnter(args) {
    if (!SETTINGS.enableHooksArcadeItems) {
      logDim("Skipped!");
      return null;
    }

    const thiz = args[0].wrap();

    const itemName = thiz.itemName_.value;

    const separator = SETTINGS.singleSentence ? "" : "\r\n";
    const itemDescObj = thiz.itemDesc_.wrap();
    const length = itemDescObj.Length.unbox().readS32();
    let itemDesc = "";
    for (let i = 0; i < length; i++) {
      itemDesc += readString(itemDescObj.Get(i)) + separator;
    }

    handler(itemName + "\r\n" + itemDesc + "\r\n");
  },
});

//#endregion

let previous = "";
trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  DEBUG_LOGS && console.warn(JSON.stringify(s));

  return s.trim();
});

//#region UI Config

ui.title = "Shooters, Ready!";
ui.description = /*html*/ `
<small class='text-muted'>Made with Game Version <code>1.0.2</code></small>
<br>Configure text output and which hooks are enabled.
<br>Check Agent's console output to see each text's hook name.
`;

ui.storage = false;

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
    label: "Character Names",
    help: "Display character names in dialogues.",
    defaultValue: true,
  },
  {
    id: "enableHooksTips",
    type: "checkbox",
    label: "Pause Menu Tips",
    help: "Display tips shown in the pause menu.",
    defaultValue: true,
  },
  {
    id: "enableHooksMenuExplanation",
    type: "checkbox",
    label: "Menu Explanations",
    help: "Display the bottom messages when hovering over options.",
    defaultValue: true,
  },
  {
    id: "enableHooksArcadeItems",
    type: "checkbox",
    label: "Arcade Items",
    help: "Display item names and descriptions in the arcade.",
    defaultValue: true,
  },
];

ui.onchange = (id, current, previous) => {
  SETTINGS[id] = current;

  logDim(`UI: ${id} set to ${current}`);
};

ui.open()
  .then(() => {
    console.log("UI: UI loaded!");
  })
  .catch((err) => {
    console.error("UI: Error!\n" + err.stack);
  });

//#endregion
