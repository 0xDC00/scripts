// ==UserScript==
// @name         Kemono Teatime (けものティータイム)
// @version      1.0.0
// @author       Mansive
// @description  Steam
// * Studio Lalala
// * Unity (IL2CPP)
//
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

/**
 * @typedef {Object} BorderPreset
 * @property {string} left
 * @property {string} right
 * @property {string} top
 * @property {string} bottom
 */

//#endregion

//#region Config

const ui = require("./libUI.js");
const Mono = require("./libMono.js");

const BACKTRACE = false;
const untestedHookMessage = "This hook isn't tested, tell me if it works or not!";

const SETTINGS = {
  fancyOutput: true, // works best for CJK languages
  singleSentence: true, // should only be applicable when fancyOutput is false
  noCharacterNames: false, // do not output character names
  onlyDialogue: false, // only output dialogue text
  filterSeenText: false, // filters out text that has already been sent during the game session
  debugLogs: false,
};

//#endregion

//#region Backtrace

if (BACKTRACE === true) {
  // system texts?
  // Mono.setHook("", "ART_TMProText", "SetText", -1, {
  //   onEnter(args) {
  //     console.log(JSON.stringify(args[1].readMonoString()));
  //     const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
  //     console.log("callstack:", callstack.splice(0, 8), "\n");
  //   },
  // });
  //

  // dialogue texts?
  Mono.setHook("", "ART_TMProTextSystem", "SetText", 4, {
    onEnter(args) {
      const text = args[1].readMonoString();
      if (!text) {
        return;
      }
      console.log(JSON.stringify(text));
      const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
      console.log("callstack:", callstack.splice(0, 8), "\n");
    },
  });
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

/**
 * Gets the length of the longest line in an array.
 * @param {string[]} array
 */
function getMaxLength(array) {
  return Math.max(...array.map((value) => value.length));
}

/** @type {BorderPreset} */
const simpleBorder = {
  left: "｜",
  right: "｜",
  top: "￣",
  bottom: "＿",
};

// TODO: add text centering
/**
 * Creates a simple or fancy ASCII textbox.\
 * Works best with characters of the same width.\
 * Probably a huge waste of time.
 * @param {Object} style
 * @param {string=} style.type
 * @param {Object} style.tail - Thing on speech bubbles that points towards the speaker
 * @param {"left"|"right"} style.tail.direction
 * @param {"top"|"middle"|"bottom"} style.tail.position
 * @param {string} style.tail.material
 * @param {string} style.text - Text that will be fit inside the container.
 * @param {number=} style.maxLength - Max length of the text, not the container.
 * @param {number=} style.maxHeight
 * @param {string} style.spacer - Character used for padding and margins
 * @param {Object} style.padding - Padding between text and border
 * @param {number} style.padding.left
 * @param {number} style.padding.right
 * @param {number} style.padding.top
 * @param {number} style.padding.bottom
 * @param {Object} style.margin
 * @param {number} style.margin.left
 * @param {number} style.margin.right
 * @param {number} style.margin.top
 * @param {number} style.margin.bottom
 * @param {Object} style.borderMaterial - Characters used for border. Can set each side individually
 * @param {string} style.borderMaterial.left
 * @param {string} style.borderMaterial.right
 * @param {string} style.borderMaterial.top
 * @param {string} style.borderMaterial.bottom
 * @param {string} style.borderMaterial.all - Set and override all border materials
 * @returns {string}
 */
function createTextContainer({
  type,
  text,
  tail,
  maxLength,
  maxHeight,
  spacer = "　",
  padding = { left: 0, right: 0, top: 0, bottom: 0 },
  margin = { left: 0, right: 0, top: 0, bottom: 0 },
  borderMaterial = { left: "", right: "", top: "", bottom: "", all: "" },
}) {
  if (typeof text !== "string") {
    throw new TypeError("The text passed in was not a string");
  }

  const textLines = text.split("\n");

  if (!maxLength) {
    maxLength = getMaxLength(textLines);
  }

  if (maxLength === 0) {
    return "";
  }

  if (borderMaterial.all) {
    borderMaterial.left = borderMaterial.all;
    borderMaterial.right = borderMaterial.all;
    borderMaterial.top = borderMaterial.all;
    borderMaterial.bottom = borderMaterial.all;
  }

  const { left: matLeft, right: matRight, top: matTop, bottom: matBottom } = borderMaterial;

  const leftMargin = spacer.repeat(margin.left);
  const rightMargin = spacer.repeat(margin.right);
  const topMargin = "\n".repeat(margin.top);
  const bottomMargin = "\n".repeat(margin.bottom);

  const leftWall = leftMargin + matLeft;
  const rightWall = rightMargin + matRight;

  // set up ceiling and floor
  const borderLength = maxLength + padding.left + padding.right;
  const topBorder = matTop && leftWall + matTop.repeat(borderLength) + rightWall;
  const bottomBorder = matBottom && leftWall + matBottom.repeat(borderLength) + rightWall;

  // push text away from side walls
  const leftPadding = spacer.repeat(padding.left);
  const rightPadding = spacer.repeat(padding.right);

  // extend walls vertically, don't include last newline
  const paddingLine = leftWall + spacer.repeat(borderLength) + rightWall + "\n";
  const topPadding = paddingLine.repeat(padding.top).slice(0, -1);
  const bottomPadding = paddingLine.repeat(padding.bottom).slice(0, -1);

  // put text between the padding and walls
  const middleContent = textLines.map((line) => {
    const paddedText = line.padEnd(maxLength, spacer);
    return leftWall + leftPadding + paddedText + rightPadding + rightWall;
  });

  // stack everything together, filtering empty strings to avoid redundant newlines from later join
  let container = [
    topMargin,
    topBorder,
    topPadding,
    ...middleContent,
    bottomPadding,
    bottomBorder,
    bottomMargin,
  ].filter(Boolean);

  if (tail) {
    let tailIndex = Number.MAX_SAFE_INTEGER;
    switch (tail.position) {
      case "top":
        tailIndex = 0;
        break;
      case "middle":
        tailIndex = Math.max(0, Math.floor((container.length - 1) / 2));
        break;
      case "bottom":
        tailIndex = Math.max(0, container.length - 1);
        break;
      default:
        throw new Error(`Unknown tail position: ${tail.position}`);
    }

    // append tail to string array at specified position
    const appendTail =
      tail.direction === "left"
        ? (line, index) => (index === tailIndex ? tail.material : spacer) + line // left
        : (line, index) => (index === tailIndex ? line + tail.material : line) + spacer; // right

    container = container.map((line, index) => appendTail(line, index));
  }

  return container.join("\n");
}

/** @param {string} text */
function logText(text) {
  console.log(`${color.FgYellow}${JSON.stringify(text)}${color.Reset}`);
}

/** 
 * Used for less important logs.
 * @param {string} text
 */
function logDim(message) {
  console.log(`${color.Dim}${message}${color.Reset}`);
}

/**
 * Converts split lines of sentences into a single sentence.
 * @param {string} text
 */
function toSingleSentence(text) {
  return SETTINGS.singleSentence ? text.replace(/([^。…？！）\n])\n(?!\n)/g, "$1") : text;
}

//#endregion

//#region Handlers

let timer1 = null;
let timer3 = null;

let isBacklogOpen = false;
let backlogTimer = -1;

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

/** Manages the ordering of dialogue. */
const talkController = {
  texts: [],
  names: [],
  customerText: "",
  talkTimer: -1,

  get isChoosingTime() {
    return this.customerText.length > 0;
  },

  clearTexts() {
    this.texts.length = 0;
    this.names.length = 0;
    this.customerText = "";
  },

  customerTextHandler(text) {
    this.customerText = text;
  },

  nameHandler(name) {
    this.names.push(name);
  },

  textHandler(text) {
    this.texts.push(text);

    clearTimeout(this.talkTimer);
    this.talkTimer = setTimeout(() => {
      const texts = this.texts;

      const outputChoose = () => {
        const second = texts.pop();
        const first = texts.pop();
        return SETTINGS.fancyOutput
          ? chooseBubbles({ top: first, middle: this.customerText, bottom: second })
          : [first, this.customerText, second].join("\n\n");
      };

      const outputNormal = () => {
        const names = this.names;
        return texts
          .map((text, index) => (names[index] ? names[index] + "\n" : "") + text)
          .join("\n");
      };

      const result = this.isChoosingTime ? outputChoose() : outputNormal();

      trans.send(result);
      this.clearTexts();
    }, 200);
  },
};

//#endregion

//#region Wasteland

const SetText = Mono.use("", "ART_TMProText").SetText;

function chooseBubbles({ top, middle, bottom }) {
  const padding = { left: 1, right: 1, top: 0, bottom: 0 };
  const borderMaterial = simpleBorder; // ～

  // taruto
  const topBubble = createTextContainer({
    text: top,
    tail: {
      direction: "left",
      position: "bottom",
      material: "＜",
    },
    padding: padding,
    borderMaterial: borderMaterial,
  });

  // customer
  const middleBubble = createTextContainer({
    text: middle,
    tail: {
      direction: "right",
      position: "middle",
      material: "＞",
    },
    padding: padding,
    margin: {
      left: 2,
    },
    borderMaterial: borderMaterial,
  });

  // makaron
  const bottomBubble = createTextContainer({
    text: bottom,
    tail: {
      direction: "left",
      position: "top",
      material: "＜",
    },
    padding: padding,
    borderMaterial: borderMaterial,
  });

  const result = [topBubble, middleBubble, bottomBubble].join("\n\n");
  return result;
}

// public class Talk
// public string Text(TalkID id)
Mono.setHook("", "Talk", "Text", -1, {
  onLeave(retval) {
    console.log("onLeave: Talk.Text");

    const text = toSingleSentence(readString(retval).trimStart());
    setTimeout(() => talkController.textHandler(text), 5); // make text appear after name
  },
});

Mono.setHook("", "ART_ScriptEngineBackLogWindow", "Setup", -1, {
  onEnter() {
    // console.log("onEnter: ART_ScriptEngineBackLogWindow.Setup");
    isBacklogOpen = true;

    clearTimeout(backlogTimer);
    backlogTimer = setTimeout(() => {
      isBacklogOpen = false;
      console.warn("backlog closed");
    }, 50);
  },
});

// public class EventCharaName
// public string GetNameText(EventCharaNameID chName)
// spammed on every frame when opening logs
Mono.setHook("", "EventCharaName", "GetNameText", -1, {
  onLeave(retval) {
    if (isBacklogOpen || SETTINGS.noCharacterNames) {
      return null;
    }

    console.log("onLeave: EventCharaName.GetNameText");

    const text = readString(retval);
    talkController.nameHandler(text);
  },
});

// spammed on every frame when opening logs
let previous_ChooseData_TextReturn_text = "";
Mono.setHook("", "ChooseData", "TextReturn", -1, {
  onLeave(retval) {
    if (isBacklogOpen) {
      return null;
    }

    console.log("onLeave: ChooseData.TextReturn");

    const customerText = readString(retval);

    if (customerText === previous_ChooseData_TextReturn_text) {
      return null;
    }
    previous_ChooseData_TextReturn_text = customerText;

    talkController.customerTextHandler(toSingleSentence(customerText));
  },
});

// food switching
// first: GameAssembly.dll+409781 - E8 CA0C0000           - call FoodandRecipiDetail.SetDetail
// later: GameAssembly.dll+40AB52 - E8 C951FCFF           - call ART_TMProText.SetText
// Mono.setHook("Unity.TextMeshPro", "TMPro.TMP_Text", "PopulateTextProcessingArray", -1, {
//   onEnter(args) {
//     console.log("onEnter: PopulateTextProcessingArray");
//     const text = this.context.rbp.readMonoString().replace(/<\/?color[^\>]*>/g, "");
//     handler(text);
//   },
// });

const SweetsData = Mono.use("", "SweetsData");
const SweetsData_NameReturn = SweetsData.NameReturn;
// const SweetsData_DetailReturn = SweetsData.DetailReturn;

const FoodMaterialData = Mono.use("", "FoodMaterialData");
const FoodMaterialData_NameReturn = FoodMaterialData.NameReturn;
const FoodMaterialData_DetailReturn = FoodMaterialData.DetailReturn;

Mono.setHook("", "FoodandRecipiDetail", "SetDetail", -1, {
  onEnter() {
    if (SETTINGS.onlyDialogue) {
      logDim("skipped: FoodandRecipiDetail.SetDetail");
      return null;
    }

    console.log("onEnter: FoodandRecipiDetail.SetDetail");

    this.hooks = [
      SweetsData_NameReturn.attach({
        onLeave(retval) {
          console.log("onLeave: SweetsData.NameReturn");

          const text = readString(retval);
          positionTopHandler(text, true);
        },
      }),
      FoodMaterialData_NameReturn.attach({
        onLeave(retval) {
          console.log("onLeave: FoodMaterialData.NameReturn");

          const text = readString(retval);
          positionMiddleHandler(text, true);
        },
      }),
      FoodMaterialData_DetailReturn.attach({
        onLeave(retval) {
          console.log("onLeave: FoodMaterialData.DetailReturn");

          topTexts.clear();

          const text = readString(retval);
          positionBottomHandler(text);
        },
      }),
    ];
  },
  onLeave() {
    this.hooks.forEach((hook) => {
      hook.detach();
    });

    // console.log("onleave: FoodandRecipiDetail.SetDetail");
    // const text = this.thiz.nameText.wrap().tmProText.wrap().text.value;
    // console.warn("setdetailreturn:", text);
    // handler(text);
  },
});

let previous_CommentData_TextReturn_Id = Number.MAX_SAFE_INTEGER;
Mono.setHook("", "CommentData", "TextReturn", -1, {
  onEnter(args) {
    this.CommentData_TextReturn_Id = args[1].toUInt32();
  },
  onLeave(retval) {
    console.log("onLeave: CommentData.TextReturn");

    // console.log(this.CommentData_TextReturn_Id, previous_CommentData_TextReturn_Id);
    // if (this.CommentData_TextReturn_Id === previous_CommentData_TextReturn_Id) {
    //   return null;
    // }
    // previous_CommentData_TextReturn_Id = this.CommentData_TextReturn_Id;

    // const text = readString(retval);
    // positionBottomHandler(text, true);

    // slightly jank
    if (this.context.r9.isNull()) {
      return null;
    }

    const text = toSingleSentence(readString(retval));
    positionDeepHandler(text);
  },
});

// Mono.setHook("", "TeaRecipePrefab", "SetDetail", -1, {
//   onEnter(args) {
//     console.log(this.context.rcx.add(0x78).readPointer().readMonoString());
//   },
// });

// spammed every frame
let previous_objNum = -1;
Mono.setHook("", "TeaRecipePrefab", "SetDetail", -1, {
  onEnter(args) {
    if (SETTINGS.onlyDialogue) {
      logDim("skipped: TeaRecipePrefab.SetDetail");
      return null;
    }

    const thiz = args[0].wrap();

    if (thiz.objNum === previous_objNum) {
      return null;
    }
    previous_objNum = thiz.objNum;

    console.log("onEnter: TeaRecipePrefab.SetDetail");

    const result = thiz.nameString.value + "\n" + thiz.detailString.value;
    SETTINGS.debugLogs && logText(result);
    handler(result);
  },
});

Mono.setHook("", "P06_material", "DetailTextSet", -1, {
  onEnter(args) {
    console.log("onEnter: P06_material.DetailTextSet");

    const text = toSingleSentence(readString(args[1]));
    if (text === "???") {
      return null;
    }

    handler(text);
  },
});

// P07_Character
// args[1] -> character id; 0x0 = taruto, 0x1 = makaron
Mono.setHook("", "CharaBoard", "DataSet", -1, {
  onEnter() {
    if (SETTINGS.onlyDialogue) {
      logDim("skipped: CharaBoard.DataSet");
      return null;
    }

    console.log("onEnter: CharaBoard.DataSet");

    const texts = [];
    this.texts = texts;

    this.hook = SetText.attach({
      onEnter(args) {
        const text = readString(args[1]);
        texts.push(text);
      },
    });
  },
  onLeave() {
    if (SETTINGS.onlyDialogue) {
      return null;
    }

    this.hook.detach();

    /** @type {string[]} */
    const texts = this.texts;

    const traits = texts.slice(0, 5);
    const description = texts.at(5);
    const preferencesInfo = texts.slice(6, 11);
    const preferencesName = texts.slice(11, 16);

    const chara = {
      traits: "",
      description: "",
      preferences: "",
    };

    // const portrait = `
    // 　／ｌ、
    // （ﾟ、　。７
    // 　ｌ、～ヽ
    // 　じしｆ＿、）ノ`;

    if (SETTINGS.fancyOutput) {
      // top
      // にゃ～

      const portrait = `
　／＼＿／＼　
｜　・　　・｜
｜゛　＿　　｜
　＼＿＿＿／　
　　ノ　｜　　`.replace(/^\n|\n$/, "");
      const portraitMaxLength = getMaxLength(portrait.split("\n"));
      chara.traits = portrait
        .split("\n")
        .map((line, index) => {
          const paddedLine = line.padEnd(portraitMaxLength, "　");
          return `${paddedLine}${traits[index]}`;
        })
        .join("\n");

      // middle
      const descriptionBox = createTextContainer({
        text: description.replace(/―/g, "ー").replace(/…/g, "．．．"),
        type: "box",
        // tail: {
        // direction: "left",
        // position: "middle",
        // material: "＜",
        // },
        maxLength: 22,
        padding: { left: 1, right: 0, top: 0, bottom: 0 },
        borderMaterial: simpleBorder,
      });
      chara.description = descriptionBox;

      // bottom
      const preferencesMaxLength = getMaxLength(preferencesName);
      chara.preferences = preferencesName
        .map((name, index) => {
          const paddedName = name.padEnd(preferencesMaxLength, "　");
          return `${paddedName}　|　${preferencesInfo[index]}`;
        })
        .join("\n");
    } else {
      chara.traits = traits.join("\n");

      chara.description = toSingleSentence(description);

      chara.preferences = preferencesName
        .map((name, index) => `${name}　${preferencesInfo[index]}`)
        .join("\n");
    }

    const board = [chara.traits, chara.description, chara.preferences].join("\n\n");
    handler(board);
  },
});

// reward boxes, 3 of them
Mono.setHook("", "P13_Reward", "SetItem", -1, {
  onEnter() {
    if (SETTINGS.onlyDialogue) {
      logDim("skipped: P13_Reward.SetItem");
      return null;
    }

    console.log("onEnter: P13_Reward.SetItem");

    const texts = [];
    this.texts = texts;

    this.hook = SetText.attach({
      onEnter(args) {
        const text = readString(args[1]);
        texts.push(text);
      },
    });
  },
  onLeave() {
    if (SETTINGS.onlyDialogue) {
      return null;
    }

    this.hook.detach();

    /** @type {string[]} */
    const texts = this.texts;

    const firstReward = texts.splice(0, 2).join("\n");
    const secondReward = texts.splice(0, 2).join("\n");
    const thirdReward = texts.splice(0, 2).join("\n");

    const rewards = [firstReward, secondReward, thirdReward].join("\n\n");
    handler(rewards);
  },
});

// character speaking when giving rewards
let previous_RewardCommentData_TextReturn_text = "";
Mono.setHook("", "RewardCommentData", "TextReturn", -1, {
  onLeave(retval) {
    console.log("onLeave: RewardCommentData.TextReturn");

    const text = readString(retval);

    if (previous_RewardCommentData_TextReturn_text === text) {
      return null;
    }
    previous_RewardCommentData_TextReturn_text = text;

    talkController.textHandler(toSingleSentence(text));
  },
});

// public string DetailReturn(int id)
let previous_NewsData_DetailReturn_Id = "";
Mono.setHook("", "NewsData", "DetailReturn", -1, {
  onEnter(args) {
    this.NewsData_DetailReturn_Id = args[1].toUInt32();
  },
  onLeave(retval) {
    console.log("onLeave: NewsData.DetailReturn");

    // news stories are huge strings, avoid reading them by just comparing their ids
    if (this.NewsData_DetailReturn_Id === previous_NewsData_DetailReturn_Id) {
      return null;
    }
    previous_NewsData_DetailReturn_Id = this.NewsData_DetailReturn_Id;

    // const text = toSingleSentence(readString(retval));
    const text = toSingleSentence(readString(retval));
    handler(text);
  },
});

// Leisure_Radio
Mono.setHook("", "RadioDetailData", "DetailReturn", -1, {
  onLeave(retval) {
    console.log("onLeave: RadioDetailData.DetailReturn");

    const text = toSingleSentence(readString(retval));
    handler(text);
  },
});

//#region Untested Hooks

// Leisure_Notice.DatalSet - 48 89 5C 24 08        - mov [rsp+08],rbx
Mono.setHook("", "Leisure_Notice", "DatalSet", -1, {
  onEnter() {
    console.log("onEnter: Leisure_Notice.DatalSet");
    console.warn(untestedHookMessage);

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
})

// FurnitureData
Mono.setHook("", "FurnitureData", "NameReturn", -1, {
  onLeave(retval) {
    console.log("onLeave: FurnitureData.NameReturn");
    console.warn(untestedHookMessage);

    const text = readString(retval);
    handler(text);
  },
});

// FurnitureData
Mono.setHook("", "FurnitureData", "DetailReturn", -1, {
  onLeave(retval) {
    console.log("onLeave: FurnitureData.DetailReturn");
    console.warn(untestedHookMessage);

    const text = toSingleSentence(readString(retval));
    handler(text);
  },
});

// OtherData
Mono.setHook("", "OtherData", "NameReturn", -1, {
  onLeave(retval) {
    console.log("onLeave: OtherData.DetailReturn");
    console.warn(untestedHookMessage);

    const text = readString(retval);
    handler(text);
  },
});


// OtherData
Mono.setHook("", "OtherData", "DetailReturn", -1, {
  onLeave(retval) {
    console.log("onLeave: OtherData.DetailReturn");
    console.warn(untestedHookMessage);

    const text = toSingleSentence(readString(retval));
    handler(text);
  },
});


//#endregion

//#endregion

let previous = "";
trans.replace((s) => {
  if (s === previous) {
    return null;
  }
  previous = s;

  SETTINGS.debugLogs && console.warn(JSON.stringify(s));

  return s
    .replace(/<\/?color[^\>]*>/g, "")
    .replace(/^\r?\n/g, "")
    .trimEnd();
});

//#region UI Configuration

ui.title = "Kemono Teatime";
ui.description = /*html*/ `Configure text output and which hooks are enabled.
<br>Check Agent's console output to see each text's corresponding hook.`;
ui.options = [
  {
    id: "fancyOutput",
    type: "checkbox",
    label: "Fancy Portraits",
    defaultValue: SETTINGS.fancyOutput,
  },
  {
    id: "singleSentence",
    type: "checkbox",
    label: "Single Sentence",
    defaultValue: SETTINGS.singleSentence,
  },
  {
    id: "noCharacterNames",
    type: "checkbox",
    label: "Character Names",
    defaultValue: SETTINGS.noCharacterNames,
  },
  {
    id: "onlyDialogue",
    type: "checkbox",
    label: "Only Dialogue",
    defaultValue: SETTINGS.onlyDialogue,
  },
  {
    id: "filterSeenText",
    type: "checkbox",
    label: "Filter Seen Text",
    defaultValue: SETTINGS.filterSeenText,
  },
  {
    id: "debugLogs",
    type: "checkbox",
    label: "Show Debug Logs",
    defaultValue: SETTINGS.debugLogs,
  },
];

ui.onchange = (id, current, previous) => {
  logDim(`UI: ${id} set to ${current}`);

  if (SETTINGS[id] !== undefined) {
    SETTINGS[id] = current;
  } else {
    console.error(`UI: Unknown setting ${id}`);
    // throw new Error(`Unknown setting ${id}`); // doesn't actually throw???
  }
};

//#region UI CSS

// https://github.com/Mansive/teatime
ui.userStyle = /*css*/ `#title,
#description {
  display: none;
}

@font-face {
  font-family: "FusionPixel";
  /* assets/fusion-pixel-10px-monospaced-latin-min.woff2 */
  src: url("data:font/woff2;base64,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");
  font-weight: normal;
  font-style: normal;
}

* {
  font-family: "FusionPixel" !important;
  text-rendering: geometricPrecision;
  /* assets/kmtt-cursor-handmin-hyper.svg */
  cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 50'><g stroke-width='2'><path fill='%23fff7d6' stroke='%23fff7d6' stroke-linecap='square' d='M5 33V5h2v2h2v2h2v2h2v2h2v2h2v2h2v2h2v2h2v2h2v2H13v2h-2v2H9v2H7v2z'/><path d='M7 34V4m4 26V8m4 4v14m4-10v10' stroke='%23ffefb5'/><path stroke='%23fff3c6' d='M15 24h10v1H15zm-4 4h2v1h-2zm-4 4h2v1H7z'/><path fill='%23ffefc6' stroke='%23ffefc6' d='M15 35h6v8h-6z'/><path fill='%23fff7d6' stroke='%23fff7d6' d='M19 36h4v6h-4z'/><path stroke='%235a5247' d='M14 44h2m6-1h2'/><path stroke='%236b4f42' d='M4 35h4m-2 0h2m0-2h2m2-4h2m-4 2h2m4 14h6'/><path stroke='%238c4d42' d='M14 27h12M4 36h4m2-4h2'/><path stroke='%23ffefbd' d='M23 21h2v1h-2zm-4-4h2v1h-2zm-4-4h2v1h-2zm-4-4h2v1h-2zM7 5h2v1H7zm14 38v-9'/><g stroke='%23000'><path d='M3 35V5m2-2h2m2 2h0m2 2h0m2 2h0m2 2h0m2 2h0m2 2h0m2 2h0m2 2h0m2 2h0m-10 8h10m2-2v-4m-14 8h0m-2 2h0m-2 2h0m-4 2h2' stroke-linecap='square'/><path d='M13 36v8m3 3h6m-8-2h2m9-1v-8m-3-3h-6m8 2h-2m0 10h2M14 35h2'/></g></g><path stroke='%238c4d42' d='M14 42.5h2m6 1h2'/></svg>") 4 2, auto;
}

input[type="checkbox"]:hover {
  /* assets/kmtt-cursor-hover-handmin.svg */
  cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 50'><g stroke-width='2'><g stroke-linecap='square'><path fill='%23ffefb5' stroke='%23000' d='M21 47h6v-2h4v-2h4v-2h2v-2h2v-2h2v-2h-2v-2h-2V21h-2v-2h-2v-2h-2v-2h-4v-2h-4v2h-4v-2h-2V9h-2V5h-2V3H9v2H7v6h2v6h2v4h2v4H5v2H3v2h2v2h2v2h4v2h2v2h2v2h2v2h2v4h2z'/><g fill='none'><path stroke='%23fff3c6' d='M34 33V21h1v12zm-21 2h2v2h1M6 29H5v-2h3v4m25-12v1'/><path stroke='%23fce5b8' d='M10 9V7h2v4h2v4h2m8 22h-6v2h6m6-4v-2h2m-6-16v2h2M16 29h-6v2h6m-3 2h-.02v.01'/><path stroke='%23fff7d6' d='M31 21v14M11 5v10m16 22V15m-8 24V18m4 26V17m-8-8v28m-4-6v2'/><path stroke='%234c222c' d='M25 45h2v-2h4v-2h2v-2h2v-2h2M11 27h2m8-10h0'/><path stroke='%23a56552' d='M25 43h-4v-2h6v-2h4v-2m-4 6h2v-2h4v-2h2v-2h2'/><path stroke='%238c4d42' d='M39 35h-2v-3 3h-2v2h-2m-12 8h3m5-2v-2h4'/></g></g><path stroke='%23aaa47e' d='M34 21h2m-5-5v4m-1-3h-1m-3-2h2m-6 0h2m-2 4h2m-7-6h1m-4-4h2m-3-4h1M9 5H8m1 6H8m2 6h2m1 4h1m2 18h1'/><path stroke='%23aaa37d' d='M6 31h2'/><path stroke='%23efb684' d='M12 29h2m3 10h1m6 0h2m2-2h2m2-2h2m0-2h2m-7-16h-1M9 27h3m5-14h-1m-3-8h-1M9 5h1m-1 6h1m2 10h1'/></g></svg>") 8 2, pointer;
}

:root {
  /* --splash-stripe-color1: #f4c094; */
  /* --splash-stripe-color2: #ecad84; */
  --splash-stripe-color1: #cb8a70;
  --splash-stripe-color2: #c67c63;
  --splash-animation-duration: 1.3s;
  --splash-animation-delay: 1.5s;
  --splash-max-width: 800px;
  --splash-width: min(100vw, var(--splash-max-width));
  --splash-stripe-width: calc(var(--splash-width) * 0.03);
  --background-color: #ffdbb5;
  --primary-stripe-rgb: #f7cba5;
  --secondary-stripe-rgb: rgba(47, 0, 255, 0);
  --stripe-point1: 25.5%;
  --stripe-point2: calc(100% - var(--stripe-point1));
  --stripe-angle1: 60deg;
  --stripe-angle2: calc(-1 * var(--stripe-angle1));

  --box-primary-color: #efb78e;
  --box-secondary-color: #f4bf94;
  --box-dashed: #c07e65;
  --box-background: #ffe3a5;
  --box-border: #bd7d63;
  --box-very-out: #ac7e62;

  --wood-plank-width: calc(100% / 12);
  --wood-plank-side-width: calc(var(--wood-plank-width) / 2);
  --wood-plank-top-width: 6px;
  --wood-plank-bottom-width: 16px;

  --wood-color-dark: #8c4e44;
  --wood-color-light: #a7654f;

  --wood-inset-dark: rgba(42, 0, 0, 0.325);
  --wood-inset-light: #d6997b6c;
  --wood-inset-length: 2px;

  --wood-grain: rgba(80, 26, 1, 0.11);
  --wood-grain-minor: rgba(80, 26, 1, 0.09);

  --wood-edge-color: #70353c;

  --wood-border-color: #d6997b;

  --paper-color: #fff3c6;
  --paper-color-dark: #fdebbd;
  --paper-border-color: #f4c389;
  --paper-border-width: 8px;
  --paper-shadow-size: 70%;

  --checkbox-corner-color: #e7aa84;
  --checkbox-border-color: #c07f65;
  --checkbox-border-bottom-color: var(--wood-color-light);
  --checkbox-inner-color: #f4c094;

  --label-font-color: #71363d;

  font-size: 120%;
}

:root::after,
:root::before,
body::after,
.container::after,
.container::before {
  content: "";
  position: fixed;
  pointer-events: none;
  image-rendering: pixelated;
  inset: 0;
}

/* curtain, floor */
:root::after {
  z-index: 4;
  background:
    /* assets/kmtt-new-day-curtain-min.webp */
    repeat-x top/min(calc(var(--splash-width) * 0.12), 12vh) url("data:image/webp;base64,UklGRpwAAABXRUJQVlA4TJAAAAAvG4AHECdAmG2c23MIEziII8w2zs1gIPsdyhFmG8f2ncFO4eY/APurKt/AUWxbcUQqCh5gIBcEZDLQ/OffVKZlbyP6PwHcZ93+KfuH8SHaq7Db0w7R2N8MXgA7kPMl0wH6WLLErwcwmusCstvoJuwihe0G4epr3Xw9tdk+pc32qalI0rzquqVUpDmlVdKWHgE="),
    /* assets/kmtt-new-day-floor.webp */
    repeat-x bottom/min(calc(var(--splash-width) * 0.16), 16vh) url("data:image/webp;base64,UklGRkQAAABXRUJQVlA4TDgAAAAvG4ACAB8gJCBTogcmEAiQKQVK1BASkCnRBxfMfwB/qgoUtW0DlWRAriR3/kYgov8ToDtvIGz/AQ==");
  animation: splash-foreground-exit var(--splash-animation-duration) ease var(--splash-animation-delay) forwards;
}

/* characters */
.container::before {
  z-index: 5;
  content: "";
  /* assets/kmtt-new-day-characters-min.webp */
  background: no-repeat bottom/min(var(--splash-width), 80vh) url("data:image/webp;base64,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");
  animation: characters-slide-up 0.4s ease-out 0.3s both, splash-foreground-exit var(--splash-animation-duration) ease var(--splash-animation-delay) forwards;
}

/* logo */
.container::after {
  z-index: 3;
  /* assets/kmtt-logo-divided-min.webp */
  background: no-repeat 50% 17%/min(calc(var(--splash-width) * 0.7), 70vh) url("data:image/webp;base64,UklGRkQCAABXRUJQVlA4TDcCAAAvXcAKED9AJmAxZXxCSr4aZAIWWyD9Xx0EQiZgscWRw6d/H/MfAP9NfSNYAxQF2pEkSbKbsDSDAFkg+V2VGFAAPg0WTwBeKwCvVQH6W/fMLq//iP5PQIt/ds3/Qv+jIn7WS1qv6bdPNC+tec0Pb594qSjrCZ3oJX1QHi2tTR9Lvy1JnkGUPQJux+b2RYsH2raegZryQL/v+uCZ3rQgiahpO7tEaCkLehK6BHQNbT++p4aURQ2xR2wmC1AeoDzUZEd5qGnbnp2tTdsjuuxY/Xho6XKWyc621ZnQjodyXBa/72jb0xa1S6yyrbbieHrTtSP21EBvht4MbbU96lk4I55erLPOCErEw+1YetcJtRs2lOghCxG3o53UsJStVt9FPZGv6mFdbA8tqLGg75/ja/ZXoU2L2qyV3f3bK3NysZNo6dRC7o6ukASgNwnbpOyBhoR1p2b/uxraDp3Eq+AmgE60tKeyJA/dRDnW7d12kkAfrOWfPreAqCzox+Ohhpr2LGGvC+zLk/y+ACVqbkesk30lumD7t117afWSM1HifGM/vhPZwdJ3kQA9L7HV91i51LagrBqddRJPEvo+ju3svAxtqzxnQFsAfbfLZeukXEO5XtIJKTs1nkvtKVV0pl3ZomuoyZU4G3Hax0kCRNSgCypH125fdCJob7gmrvXBzvOC27s6tC+hk+jsx0vwFCfijA8nHaDzoiRnbIZtOVSip+x3PWFtOlD2/GPWTnSFQCeBQAsIT/wzw5MA");
  opacity: 0;
  animation: spotlight-fade-in 0.2s ease-in-out forwards 0.1s, splash-foreground-exit var(--splash-animation-duration) ease var(--splash-animation-delay) forwards;
}

/* spotlight */
body::after {
  z-index: 2;
  /* assets/kmtt-new-day-spotlight-min.webp */
  background: no-repeat center/max(100vw, 100vh) url("data:image/webp;base64,UklGRhYBAABXRUJQVlA4TAoBAAAvf8AfABcgFkzxUDoTC6Z4XyKNz/wHNhdc1bYVN/CBBNCDhAystEUCekBCB7BJknff6hUQ0f8JMJd1CIMR/1+THLK3JNOJMivqkkJnkTnRENNJMi+pssCmyQ7JW5bJRIQVdFkhsyCcYADJJIS/VxGBS0Mc996ITCVi7K2OKFQWjLs1oFQSxt+pmMCkYY47b0wmElH2RscUIgvK3RhgIgnlryoq8Gio4+qNyjQizl50VKGx4NzFgNNIOH9WcYFFwx1nb1wmETXsSccVEouGOxmKJJKGn6pG4NA0jumtkSlEHWtM7BqFwqLjjFmGKoWk442pOoFB0zmMeetkAlHLxq5TCCxabhnKBJKWBw==");
  mix-blend-mode: color-dodge;
  opacity: 0;
  animation: spotlight-fade-in 0.2s ease-in-out forwards 0.1s, splash-foreground-exit var(--splash-animation-duration) ease var(--splash-animation-delay) forwards;
}

/* striped background, lit by spotlight */
:root::before {
  z-index: 1;
  background: repeating-linear-gradient(to right, var(--splash-stripe-color1), var(--splash-stripe-color1) var(--splash-stripe-width), var(--splash-stripe-color2) var(--splash-stripe-width), var(--splash-stripe-color2) calc(var(--splash-stripe-width) * 2));
  animation: splash-background-exit var(--splash-animation-duration) ease var(--splash-animation-delay) forwards;
}

@keyframes characters-slide-up {
  from {
    transform: translate3d(0, 100vh, 0);
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes spotlight-fade-in {
  to {
    opacity: 1;
  }
}

@keyframes splash-foreground-exit {
  0% {
    filter: brightness(1);
    opacity: 1;
  }

  50% {
    filter: brightness(0);
    opacity: 1;
  }

  51%,
  100% {
    filter: brightness(0);
    opacity: 0;
    visibility: hidden;
  }
}

@keyframes splash-background-exit {
  0% {
    filter: brightness(1);
    opacity: 1;
  }

  50% {
    filter: brightness(0);
    opacity: 1;
  }

  95%,
  100% {
    filter: brightness(0);
    opacity: 0;
    visibility: hidden;
  }
}

/* diamond checkers */
body::before {
  content: "";
  position: fixed;
  top: -76px;
  left: -88px;
  width: calc(100% + 88px);
  height: calc(100% + 76px);
  z-index: -1;
  /* assets/kmtt-background-pattern-min.webp */
  background-image: url("data:image/webp;base64,UklGRpIAAABXRUJQVlA4TIYAAAAvK8ASAA/wbfjj/78Wfv5DC25q23ai8ysy1FRYAyV8GXRYQ0ae+N6doCCi/2rbtmHozVPKF/d3mqfkpgyrsm3Wx3pkETqiMIdJE3UCNy/A6rXETXP1CCxOB0RnDjBprk4AamsA+tTaAqyZpWs9548bWfoOv17M0nf+8SOW/uPf/n5PbsI7DQ==");
  animation: pan 3s linear reverse infinite;
}

@keyframes pan {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    /* image is 44x76, move twice the width */
    transform: translate3d(88px, 76px, 0px);
  }
}

/* #options::before {
  font-size: 200%;
  content: "Settings";
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translate(-50%, 0);
} */

/* wood board */
#options {
  z-index: 0;
  position: relative;
  background-image:
    /* insets */
    linear-gradient(to right,
      transparent calc(var(--wood-plank-side-width) - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 3 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 3 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 3 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 3 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 5 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 5 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 5 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 5 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 7 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 7 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 7 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 7 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 9 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 9 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 9 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 9 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 11 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 11 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 11 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 11 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 13 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 13 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 13 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 13 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 15 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 15 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 15 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 15 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 17 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 17 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 17 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 17 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 19 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 19 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 19 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 19 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 21 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 21 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 21 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 21 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 23 - var(--wood-inset-length)),
      var(--wood-inset-dark) calc(var(--wood-plank-side-width) * 23 - var(--wood-inset-length)),
      var(--wood-inset-light) calc(var(--wood-plank-side-width) * 23 + var(--wood-inset-length)),
      transparent calc(var(--wood-plank-side-width) * 23 + var(--wood-inset-length))),
    /* side edges */
    linear-gradient(to right,
      var(--wood-edge-color) calc(var(--wood-plank-side-width) / 2.5),
      transparent calc(var(--wood-plank-side-width) / 2.5),
      transparent calc(100% - var(--wood-plank-side-width) / 2.5),
      var(--wood-edge-color) calc(100% - var(--wood-plank-side-width) / 2.5)),
    /* top edge */
    linear-gradient(to bottom,
      var(--wood-edge-color) var(--wood-plank-top-width),
      transparent var(--wood-plank-top-width)),
    /* bottom edge */
    linear-gradient(to top,
      var(--wood-edge-color) var(--wood-plank-bottom-width),
      transparent var(--wood-plank-bottom-width)),
    /* wood grain */
    repeating-linear-gradient(to right,
      var(--wood-grain),
      var(--wood-grain) 2px,
      transparent 2px,
      transparent 9px,
      var(--wood-grain) 9px,
      var(--wood-grain) 11px,
      transparent 11px,
      transparent 25px),
    /* wood grain 2 */
    repeating-linear-gradient(85deg,
      var(--wood-grain-minor),
      var(--wood-grain-minor) 2px,
      transparent 2px,
      transparent 20px,
      var(--wood-grain-minor) 20px,
      var(--wood-grain-minor) 22px,
      transparent 22px,
      transparent 50px),
    /* wood grain 3 */
    repeating-linear-gradient(-85deg,
      var(--wood-grain-minor),
      var(--wood-grain-minor) 2px,
      transparent 2px,
      transparent 5px,
      var(--wood-grain-minor) 5px,
      var(--wood-grain-minor) 7px,
      transparent 7px,
      transparent 100px),
    /* wood grain 4 (horizontal) */
    repeating-linear-gradient(to bottom,
      transparent 8%,
      var(--wood-color-light) 8%,
      var(--wood-color-light) calc(8% + 4px),
      transparent calc(8% + 4px),
      transparent 17%,
      var(--wood-color-light) 17%,
      var(--wood-color-light) calc(17% + 2px),
      transparent calc(17% + 2px),
      transparent 19%,
      var(--wood-color-light) 19%,
      var(--wood-color-light) calc(19% + 3px),
      transparent calc(19% + 3px),
      transparent 40%,
      var(--wood-color-light) 40%,
      var(--wood-color-light) calc(40% + 2px),
      transparent calc(40% + 2px),
      transparent 60%),
    /* side edges outline */
    linear-gradient(to right,
      transparent calc(var(--wood-plank-side-width) / 2.5),
      var(--wood-border-color) calc(var(--wood-plank-side-width) / 2.5),
      var(--wood-border-color) calc(var(--wood-plank-side-width) / 2.5 + 2px),
      transparent calc(var(--wood-plank-side-width) / 2.5 + 2px),
      transparent calc(100% - var(--wood-plank-side-width) / 2.5 - 2px),
      var(--wood-border-color) calc(100% - var(--wood-plank-side-width) / 2.5 - 2px)),
    /* top edge outline */
    linear-gradient(to bottom,
      var(--wood-border-color) calc(var(--wood-plank-top-width) + 3px),
      transparent calc(var(--wood-plank-top-width) + 3px)),
    /* bottom edge outline */
    linear-gradient(to top,
      var(--wood-border-color) calc(var(--wood-plank-bottom-width) + 2px),
      transparent calc(var(--wood-plank-bottom-width) + 2px)),
    /* planks */
    linear-gradient(to right,
      var(--wood-color-light) var(--wood-plank-side-width),
      var(--wood-color-dark) var(--wood-plank-side-width),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width)),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width)),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 2),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 2),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 3),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 3),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 4),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 4),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 5),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 5),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 6),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 6),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 7),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 7),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 8),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 8),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 9),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 9),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 10),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 10),
      var(--wood-color-dark) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 11),
      var(--wood-color-light) calc(var(--wood-plank-side-width) + var(--wood-plank-width) * 11));

  border: 2px solid black;
  border-radius: 0.4rem;
  padding: 150px calc(1% + 60px);
}

/* paper */
#options::after {
  content: "";
  z-index: -1;
  position: absolute;
  top: 40px;
  left: 0px;
  right: 0px;
  bottom: 30px;
  width: 93%;
  margin: auto;

  background-image: linear-gradient(to right,
      var(--paper-border-color) var(--paper-border-width),
      transparent var(--paper-border-width)),
    linear-gradient(to left,
      var(--paper-border-color) var(--paper-border-width),
      transparent var(--paper-border-width)),
    linear-gradient(to bottom,
      var(--paper-border-color) var(--paper-border-width),
      transparent var(--paper-border-width)),
    linear-gradient(to top,
      var(--paper-border-color) var(--paper-border-width),
      transparent var(--paper-border-width)),
    radial-gradient(var(--paper-color) var(--paper-shadow-size), var(--paper-color-dark) var(--paper-shadow-size));

  border: 0px solid var(--paper-border-color);
  /* assets/kmtt-menu-combined-min.webp */
  border-image: url("data:image/webp;base64,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");
  border-image-slice: 151 206 123 206;
  border-image-width: 120px 170px 100px 170px;
  border-image-outset: 26px 5px 0px 5px;
  border-image-repeat: stretch stretch;
}

/* fork */
.mb-2>label::before {
  content: "";
  /* assets/kmtt-option-label-fork-min.webp */
  background-image: url("data:image/webp;base64,UklGRoAAAABXRUJQVlA4THQAAAAvHcALEB8gECD8VzGmQyBA8J9mR4CQgPA/W+aQ+Q+Ae1cB49i2mnxz1pZohKFEW6CITzefMb+3ch/RfwJJG/cAzyEyyxMwGzFbajBLacM0BY/F4DPmfD4aSOw4NkypSIlBnzHxGAmXN0JsZ/T4+NNxSsePEQ==");
  background-size: contain;
  background-repeat: no-repeat;
  width: 30px;
  height: 40px;
  position: absolute;
  /* left: -8px; */
  /* bottom: 0; */
  left: 13px;
  transform: translate(-100%, 0);
}

/* option labels checker pattern */
.mb-2>label {
  position: relative;
  color: var(--label-font-color);
  padding: 4px 16px;
  width: 100%;
  margin: 3% 0;
  text-align: center;
  /* assets/kmtt-option-label-pattern-min.webp */
  border-image: url("data:image/webp;base64,UklGRjoAAABXRUJQVlA4TC0AAAAvBAABEBcgEEjyFxxhJSFBwv/FNgUCSf4e860w/wHdGwQkhIy1yfSI/kdOTgIA");
  border-image-slice: 2 2 1 1 fill;
  border-image-width: 8px 8px 4px 4px;
  border-image-outset: 0px 0px 0px 0px;
  border-image-repeat: round round;
  image-rendering: pixelated;
}

.form-check {
  display: grid;
  grid-template-columns: 55% 1fr;
  align-items: center;
  padding-left: 0;
}

.form-check:hover {
  background-color: #ffd8a5;
  border-radius: 0.5rem;
  outline: 2px solid #f7be94;
  outline-offset: -2px;
}

.form-check-label {
  order: 1;
}

.form-check-input[type="checkbox"] {
  order: 2;
  justify-self: center;
  appearance: none;
  width: 20px;
  height: 20px;
  background-color: var(--checkbox-inner-color);
  margin: 4px 0px 4px 8px;

  position: relative;
  box-shadow:
    /* left, right, top edges and corners*/
    -2px -2px 0 0 var(--checkbox-border-color),
    2px -2px 0 0 var(--checkbox-border-color),
    /* bottom edge and corners */
    0 4px 0 0 var(--checkbox-border-bottom-color),
    -2px 4px 0 0 var(--wood-color-light),
    2px 4px 0 0 var(--wood-color-light);
}

.form-check-input[type="checkbox"]:checked::after {
  content: "✔";
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--wood-color-dark);
  font-size: 35px;
  font-weight: bold;
}

/* sparkles */
.form-check-input[type="checkbox"]::before {
  /* assets/kmtt-effect-sparkle.webp */
  content: url("data:image/webp;base64,UklGRp4CAABXRUJQVlA4WAoAAAASAAAAnwAAfwAAQU5JTQYAAAD/////AABBTk1GYgAAAAAAAAAAAJ8AAH8AAFAAAAFWUDhMSgAAAC+fwB8QDzD38z/T8x/wYNRGkqOWBsBSGQZLvSEtgPTL+e4T0f8JwC+eC9ECb+qVEqtaKrvpl8ty0okmKxnaAk5QsQ6xqn7ZzQcZQU5NRmgAAAAAAAAAAACfAAB/AABQAAABVlA4TFAAAAAvn8AfEA8w9/M/0/Mf8FDTRpKz0gF4KsvgqS+kA/ChyqH6JqL/E4CvVtvsq4dwwG1e6mONNo19cMO0UeFV+2qbp+pqXJJCT1oi9HKb9lkfIUFOTUZcAAAAAAAAAAAAnwAAfwAAUAAAAVZQOExEAAAAL5/AHxAPMPfzP9PzH/BQ00aSs9IBeCrLvzpIDyB1Of83Ef2fAHzqzNCJRElzphyRrpjH5nMI2oyVlCg1FKlEjfTxPP5BTk1GcgAAAAAAAAAAAJ8AAH8AAFAAAAFWUDhMWQAAAC+fwB8QDzD38z/T8x/wYBTbVps3g6Hnf/UFALESAb0n9LKJ6P8EoHOlM+4yWtML+U6vw7NRfYYJzwXf8cV1HNylMy/pjLuM1vSLPNHr8MfzCa4wWu7SmUYYAEFOTUZYAAAAAAAAAAAAnwAAfwAAUAAAAVZQOEw/AAAAL5/AHxAPMPfzP9PzH/BQ27aNZMALef8qI2WDdPf/10T0fwLwqWtawTSrIJScw+ZrCNaMMyVYw5Aq1Egfz+MPAEFOTUZaAAAAAAAAAAAAnwAAfwAAUAAAAVZQOExBAAAAL5/AHxAPMPfzP9PzH/BQE0mS8iDgraz/aCW9gEufGYKI/k+A+iQigQUkwdt8SKDKt4HZNRQRFyNFqGJRTbithxAA");
  position: absolute;
  top: calc(50% - 4px);
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 128px;
  display: block;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
}

.form-check-input[type="checkbox"]:checked::before {
  animation: sparkle-checked 0.4s forwards;
}

.form-check-input[type="checkbox"]:not(:checked)::before {
  animation: sparkle-unchecked 0.4s forwards;
}

@keyframes sparkle-checked {

  0%,
  99% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@keyframes sparkle-unchecked {

  0%,
  99% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.form-text {
  order: 3;
  /* ensure the text always goes to newline no matter the window or text size */
  width: 100%;
}

.alert {
  color: var(--label-font-color);
  text-align: center;

  background-color: var(--box-background);
  background-size: var(--background-size);
  /* background: repeating-linear-gradient(to right, var(--splash-stripe-color1), var(--splash-stripe-color1) var(--splash-stripe-width), var(--splash-stripe-color2) var(--splash-stripe-width), var(--splash-stripe-color2) calc(var(--splash-stripe-width) * 2)); */
  background-image: repeating-linear-gradient(to right, var(--box-primary-color), var(--box-primary-color) var(--splash-stripe-width), var(--box-secondary-color) var(--splash-stripe-width), var(--box-secondary-color) calc(var(--splash-stripe-width) * 2));

  border: 2px solid var(--box-background);
  border-radius: 0.6rem;

  outline: 4px solid var(--box-very-out);
  outline-offset: 0rem;
}

.alert::before {
  content: "";
  position: absolute;

  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;

  border: 5px dashed var(--box-dashed);
  border-radius: 0.3rem;

  outline: 2px solid black;
  outline-offset: 0.5rem;
}`;

//#endregion

ui.open()
  .then()
  .catch((err) => {
    console.error("Failed to open UI:", err.stack);
  });

//#endregion
