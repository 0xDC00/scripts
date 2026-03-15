// ==UserScript==
// @name         BRAVELY DEFAULT FLYING FAIRY HD Remaster (ブレイブリーデフォルト フライングフェアリー HDリマスター)
// @version      1.0.0
// @author       Mansive
// @description  Steam
// * Square Enix, Cattle Call Inc. 
//
// https://store.steampowered.com/app/2833580/BRAVELY_DEFAULT_FLYING_FAIRY_HD_Remaster/
// ==/UserScript==

//#region Config

const Mono = require("./libMono.js");

const BACKTRACE = false;

const SETTINGS = {
  characterNames: true,
  debugLogs: false,
};

//#endregion

//#region Backtrace

if (BACKTRACE === true) {
  console.warn("STARTING TRACER");
  Mono.setHook("Unity.TextMeshPro", "TMPro.TMP_Text", "set_text", -1, {
    onEnter(args) {
      this.thiz = args[0].wrap();
    },
    onLeave() {
      const text = this.thiz.text.readMonoString();
      const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
      console.warn(JSON.stringify(text));
      console.log("callstack:", callstack.splice(0, 8), "\n");
    }
  });

  // Mono.setHook("Unity.TextMeshPro", "TMPro.TMP_Text", "ParseInputText", -1, {
  //   onEnter(args) {
  //     const text = args[0].wrap().text.readMonoString();
  //     const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
  //     console.warn(JSON.stringify(text));
  //     console.log("callstack:", callstack.splice(0, 8), "\n");   
  //   }
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
  SETTINGS.debugLogs && console.log(`${color.FgYellow}${JSON.stringify(text)}${color.Reset}`);
}

/**
 * Used for less important logs.
 * @param {string} text
 */
function logDim(message) {
  console.log(`${color.Dim}${message}${color.Reset}`);
}

//#endregion

//#region Handlers

let timer1 = null;
let timer3 = null;

const seenText = new Set();
const texts1 = new Set();

const topTexts = new Set();
const middleTexts = new Set();
const bottomTexts = new Set();
const deepTexts = new Set();

/** @param {NativePointer} address */
function readString(address) {
  const text = address.readMonoString();

  SETTINGS.debugLogs && logText(text);

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

const talkController = {
  name: "",
  message: "",
  timer: -1,

  clear() {
    this.name = "";
    this.message = "";
  },

  nameHandler(text) {
    this.name = text;
    this.output(this.name + "\n" + this.message);
  },

  messageHandler(text) {
    this.message = text;
    this.output(this.message);
  },

  output(text) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      trans.send(text);
      this.clear();
    }, 50);
  }
}

//#endregion

//#region Wasteland

// const SetText = Mono.use("Unity.TextMeshPro", "TMPro.TMP_Text").ParseInputText;
const SetText = Mono.use("Unity.TextMeshPro", "TMPro.TMP_Text").set_text;

Mono.setHook("", "MB_Title", "NewGameInfoText", -1, {
  onEnter(args) {
    this.thiz = args[0].wrap();
  },
  onLeave() {
    const text = this.thiz.o_newGameInfoText.wrap().text.value
    logText(text);
    positionMiddleHandler(text);
  }
});

const subtitles = new Set();
Mono.setHook("", "SubtitlesRenderer", "SetSubtitleText", -1, {
  onEnter(args) {
    const text = readString(args[1]);
    // const n = args[2]; // line number

    if (subtitles.has(text)) {
      return;
    }
    subtitles.add(text);

    console.log("onEnter: SubTitlesRenderer.SetSubtitleText");
    handler(text);
  }
});

// Mono.setHook("", "MB_BalloonMsg", "SetString", 4, {
//   onEnter(args) {
//     console.log("onEnter: MB_BalloonMsg.SetString")
//     const text = readString(args[1]);
//     // const noClose = args[2];
//     // const mode = args[3];
//     // const voice = args[4];
//     // console.warn(text);
//     handler(text);
//   }
// });

// one call to get name and big message, but awkward timing
Mono.setHook("", "MB_BustUpMessage", "SetString", -1, {
  onEnter(args) {
    console.log("onEnter: MB_BustUpMessage.SetString");
    this.thiz = args[0].wrap();
  },
  onLeave() {
    if (!SETTINGS.characterNames) {
      logDim("skipped: MB_BustUpMessage.SetString");
      return;
    }

    console.log("onLeave: MB_BustUpMessage.SetString");

    /** @type {Mono.NativePointerMono} */
    const thiz = this.thiz;
    const name = thiz.namePlate.wrap().text.value;
    // const text = thiz.m_feed.wrap().m_text.value;
    // const result = (name + "\n" + text).trim();
    logText(name);
    talkController.nameHandler(name);
  }
})

// just message, but accurate timing
Mono.setHook("", "MessageFeed", "Set", -1, {
  onEnter(args) {
    console.log("onEnter: MessageFeed.Set");
    const text = readString(args[1]);
    talkController.messageHandler(text);
  }
});

// gets called for both name and message and other stuff
// Mono.setHook("", "WordReplace", "GameReplace", -1, {
//   onEnter(args) {
//     console.log("onEnter: WordReplace.GameReplace");
//     const text = readString(args[0]);
//     // const esc = args[1];
//     const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
//     console.warn(JSON.stringify(text));
//     console.log("callstack:", callstack.splice(0, 8), "\n");   
//     // handler(text);
//   }
// });

// merchant dialogue
Mono.setHook("", "UIRoot.ShopManager", "GetMasterText", -1, {
  // onEnter(args) {
  //   // const index = args[1];
  // }
  onLeave(retval) {
    console.log("onLeave: UIRoot.ShopManager.GetMasterText");
    const text = readString(retval);
    positionTopHandler(text);
  }
})

// the little strip at the bottom with a message
Mono.setHook("", "UIRoot.MainMenu$Guide", "SetText", -1, {
  onEnter(args) {
    console.log("onEnter: UIRoot.MainMenu$Guide.SetText");
    const text = readString(args[0]);
    positionMiddleHandler(text);
  }
})

// popup dialogs
Mono.setHook("", "MB_FieldDialog", "OpenImpl", 2, {
  onEnter(args) {
    console.log("onEnter: MB_FieldDialog.Open");
    const str = args[1];
    // const bNoClose = args[2];
    const text = readString(str);
    handler(text);
  },
})

Mono.setHook("", "MB_ItemGetDialog", "OpenTreasure", -1, {
  onEnter(args) {
    this.thiz = args[0].wrap();
  },
  onLeave() {
    console.log("onLeave: MB_ItemGetDialog");
    const text = this.thiz.m_text.wrap().text.value;
    logText(text);
    handler(text);
  }
})

// private void TextSet(GameObject obj, string[] text, int start, int end, bool hideParent)
Mono.setHook("", "UIRoot.GuideMenu", "TextSet", -1, {
  onEnter(args) {
    const stringArray = args[2].value; // string[]
    const length = stringArray.length;
    
    // check if it's just outputting the mp cost
    const firstLine = stringArray[0];
    if (length === 1 && (firstLine >= "0" && firstLine <= "9")) {
      return;
    }
    
    const lines = [firstLine];
    for (let i = 1; i < length; i++) {
      lines[i] = stringArray[i];
    }
    const text = lines.join("\n");
    handler(text);
  },
})

//#endregion

//#region trans.replace

let previous = "";
trans.replace((/** @type {string} */s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  SETTINGS.debugLogs && console.warn(JSON.stringify(s));

  if (SETTINGS.filterSeenText) {
    if (seenText.has(s)) {
      logDim("Filtered seen text: " + JSON.stringify(s));
      return null;
    }
    seenText.add(s);
  }

  // s = s.replace(/\[PCM1\]/g, "ティズ");
  // s = s.replace(/\[PCF1\]/g, "アニエス");
  s = s.replace(/<sprite[^>]+>/g, "▢");
  s = s.replace(/<[^>]+>/g, "");

  return s.trim();
});

//#endregion