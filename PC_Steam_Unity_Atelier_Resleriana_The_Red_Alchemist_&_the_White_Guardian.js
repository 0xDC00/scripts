// ==UserScript==
// @name         Atelier Resleriana: The Red Alchemist & the White Guardian (紅の錬金術士と白の守護者 ～レスレリアーナのアトリエ～)
// @version      0.1
// @author       Mansive
// @description  Steam
// * Gust
// * KOEI TECMO GAMES CO., LTD.
// * Unity (IL2CPP)
// https://store.steampowered.com/app/2698470/Kemono_Teatime/
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

const Mono = require("./libMono.js");

const BACKTRACE = false;
const DEBUG_LOGS = true;

//#endregion

//#region Backtrace

if (BACKTRACE === true) {
  // Mono.setHook("", "ART_TMProText", "SetText", -1, {
  //   onEnter(args) {
  //     args[0].wrap().console.log(args[1].readMonoString());
  //     const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
  //     console.warn("callstack:", callstack.splice(0, 8));
  //   },
  // });
  return;
}

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

/** @param {string} text */
function logText(text) {
  console.log(`${color.FgYellow}${JSON.stringify(text)}${color.Reset}`);
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
    trans.send([...texts1].join("\n"));
    texts1.clear();
  }, delay);
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
function positionTopHandler(text, list = false) {
  bottomTexts.clear();

  textSetControl(text, topTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionMiddleHandler(text, list = false) {
  bottomTexts.clear();

  textSetControl(text, middleTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionBottomHandler(text, list = false) {
  textSetControl(text, bottomTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler & {list: boolean}} */
function positionDeepHandler(text, list = false) {
  textSetControl(text, deepTexts, list);
  orderedHandler();

  return text;
}

//#endregion

//#region Wasteland
/**
 * @param {string} imageName
 * @param {string} className
 * @param {string} methodName
 * @param {number} argCount
 * @param {Mono.InvocationListenerCallbacksMono|Mono.InstructionProbeCallbackMono} callbacks
 * @returns {InvocationListener}
 */
function setHook(imageName, className, methodName, argCount, callbacks) {
  const callbacksWrapper = {};
  if (callbacks.onEnter instanceof Function === true) {
    callbacksWrapper.onEnter = function (args) {
      console.log(`onEnter: ${className}.${methodName}`);
      callbacks.onEnter(args);
    };
  }
  if (callbacks.onLeave instanceof Function === true) {
    callbacksWrapper.onLeave = function (retval) {
      // console.log(`onLeave: ${className}.${methodName}`);
      callbacks.onLeave(retval);
    };
  }
  return Mono.setHook(imageName, className, methodName, argCount, callbacksWrapper);
}

const SetText = Mono.use("Broom", "CustomTextMeshProUGUI").SetText;

// Mono.setHook("Broom", "CustomTextMeshProUGUI", "SetText", -1, {
//   onEnter(args) {
//     console.log("onEnter: CustomTextMeshProUGUI.SetText");

//     const text = this.context.rdx.readMonoString();
//     handler(text);
//   },
// });

// Mono.setHook("Unity.TextMeshPro", "TMPro.TMP_Text", "PopulateTextBackingArray", -1, {
//   onEnter(args) {
//     console.warn(args[1].readMonoString());
//   },
// });

//Broom.UI.Title.TitleChooseProtagonistWindowView.Init - 48 89 5C 24 08        - mov [rsp+08],rbx
// Initial message upon entering the screen to choose protagonist
setHook("Broom", "Broom.UI.Title.TitleChooseProtagonistWindowView", "Init", -1, {
  onEnter(args) {
    const text = readString(args[1]);
    handler(text);
  },
});

// System.String
// System.String,System.Int32,System.Int32
// System.Text.StringBuilder,System.Int32,System.Int32
// System.Char[],System.Int32,System.Int32
const PopulateTextBackingArray = Mono.findMethod(
  "Unity.TextMeshPro",
  "TMPro.TMP_Text",
  "PopulateTextBackingArray",
).overload("System.String", "System.Int32", "System.Int32");

// PopulateTextBackingArray.attach({
//   onEnter(args) {
//     console.warn(args[1].readMonoString());
//   },
// });

// Protagonist choose text
// Example Output:
// 0. リアス
// 1. リアス
// 2. 思い出を胸に秘め\n運命と出会う冒険者
// 3. リアス <-- Detach here
setHook(
  "Broom",
  "Broom.UI.Title.TitleChooseProtagonistWindowRepository",
  "SetProtagonistSelectStateAndNotify",
  -1,
  {
    onEnter(args) {
      let i = 0;
      const hook = PopulateTextBackingArray.attach({
        onEnter(args) {
          if (i === 3) {
            hook.detach();
            return null;
          }
          i++;

          const text = readString(args[1]);

          handler(text);
        },
      });
    },
  },
);

// Cinematic dialogue
setHook("Broom", "Broom.UI.TalkEvent.CinemaScopeEventDialogWindowModel", "NoticeDispMessage", -1, {
  onEnter(args) {
    const text = readString(args[1]);
    handler(text);
  },
});

// Character introduction
setHook("Broom", "Broom.UI.TalkEvent.CinemaScopeEventDialogWindowView", "DispIntro", -1, {
  onEnter(args) {
    const speaker = readString(args[1]);
    // const engName = readString(args[2]);
    const describe = readString(args[3]);

    const text = speaker + "\n" + describe;
    handler(text);
  },
});

// setHook("Broom", "TutorialDialogModel", "PDJHHBPJCJL", -1, {
//   onEnter(args) {
//     this.hook = SetText.attach({
//       onEnter(args) {
//         const text = readString(args[1]);
//         handler(text);
//       },
//     });
//   },
//   onLeave() {
//     this.hook.detach();
//   },
// });

// Tutorial messages
setHook("Broom", "TutorialDialogPresenter", "AOKFDGHDAND", -1, {
  onEnter(args) {
    this.hook = SetText.attach({
      onEnter(args) {
        const text = readString(args[1]);
        handler(text);
      },
    });
  },
  onLeave() {
    this.hook.detach();
  },
});

// Overworld charcater dialogue
// Broom.UI.TalkEvent.TimelineEventDialogueWindowModel.DispText - 48 89 5C 24 08        - mov [rsp+08],rbx
setHook("Broom", "Broom.UI.TalkEvent.TimelineEventDialogueWindowModel", "DispText", -1, {
  onEnter(args) {
    const characterName = readString(args[1]);
    const dialogueMessage = readString(args[2]);

    if (dialogueMessage === "") {
      return null;
    }

    const text = characterName + "\n" + dialogueMessage;
    handler(text);
  },
});

// Battle Tutorial messages
// CommonPlayableTutorialView.Init - 48 89 5C 24 18        - mov [rsp+18],rbx
setHook("Broom", "CommonPlayableTutorialView", "Init", 8, {
  onEnter(args) {
    const text = readString(args[1]);
    handler(text);
  },
});

//#endregion

let previous = "";
trans.replace((s) => {
  DEBUG_LOGS && console.warn(JSON.stringify(s));

  s = s.replace(/<input-action[^>]+>|<sprite[^>]+>/g, "▢");
  s = s.replace(/<\/?style[^>]*>/g, "");

  return s;
});
