// ==UserScript==
// @name         Kemono Teatime (けものティータイム)
// @version      Demo
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

const Mono = require("./libMono.js");

const BACKTRACE = false;
const DEBUG_LOGS = false;

const OPTIONS = {
  fancyOutput: true, // works best for CJK languages
  singleSentence: false, // should only be applicable when fancyOutput is false
};

//#endregion

//#region Backtrace

if (BACKTRACE === true) {
  // too much text
  // Mono.setHook("", "ART_TMProText", "SetText", -1, {
  //   onEnter(args) {
  //     console.log(args[1].readMonoString());
  //     const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
  //     console.warn("callstack:", callstack.splice(0, 8));
  //   },
  // });
  // WORKING
  // ART_ScriptEngineTalkWindow
  // public void SetText(string text)
  // Mono.setHook("", "ART_ScriptEngineTalkWindow", "SetText", -1, {
  //   onEnter(outerargs) {
  //     console.log("onEnter: talk window set text");
  //     // public void SetText(string text, bool enableTag = false, bool direct = true, FontSettingID fontSettingID = FontSettingID.LENGTH)
  //     this.hook = Mono.setHook("", "ART_TMProTextSystem", "SetText", 4, {
  //       onEnter(args) {
  //         const text = args[1].readMonoString();
  //         console.log(text);
  //       },
  //     });
  //   },
  //   onLeave(retval) {
  //     this.hook.detach();
  //   },
  // });

  Mono.setHook("", "ART_TMProTextSystem", "SetText", 4, {
    onEnter(args) {
      console.log(args[1].readMonoString());
      const callstack = Thread.backtrace(this.context, Backtracer.ACCURATE);
      console.warn("callstack:", callstack.splice(0, 8));
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
 * Works best with characters of the same width.
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
// 6/3 = 2

/** @param {string} text */
function logText(text) {
  console.log(`${color.FgYellow}${JSON.stringify(text)}${color.Reset}`);
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
    trans.send([...topTexts, ...middleTexts, ...bottomTexts].join("\n"));

    topTexts.clear();
    middleTexts.clear();
    bottomTexts.clear();
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

/** @type {HookHandler} */
function positionTopHandler(text, list = false) {
  bottomTexts.clear();

  textSetControl(text, topTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler} */
function positionMiddleHandler(text, list = false) {
  bottomTexts.clear();

  textSetControl(text, middleTexts, list);
  orderedHandler();

  return text;
}

/** @type {HookHandler} */
function positionBottomHandler(text, list = false) {
  textSetControl(text, bottomTexts, list);
  orderedHandler();

  return text;
}

/** Manages the ordering of dialogue. */
const talkController = {
  talks: new Set(),
  names: new Set(),
  talkTimer: -1,
  customerText: "",

  clearTexts() {
    this.talks.clear();
    this.names.clear();
    this.customerText = "";
  },

  customerTextHandler(text) {
    this.customerText = text;
  },

  isChoosingTime() {
    return this.customerText.length > 0;
  },

  nameHandler(name) {
    this.names.add(name);
  },

  textHandler(text) {
    this.talks.add(text);

    clearTimeout(this.talkTimer);
    this.talkTimer = setTimeout(() => {
      const texts = [...this.talks];

      if (this.isChoosingTime()) {
        const second = texts.pop();
        const first = texts.pop();

        const result = OPTIONS.fancyOutput
          ? chooseBubbles({ top: first, middle: this.customerText, bottom: second })
          : [first, this.customerText, second].join("\n\n");

        trans.send(result);
        this.clearTexts();
      } else {
        const result = [...this.names].map((name, index) => name + "\n" + texts[index]).join("\n");

        trans.send(result);
        this.clearTexts();
      }
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

    const text = readString(retval).trimStart();
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
    if (isBacklogOpen) {
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

    talkController.customerTextHandler(customerText);

    // ○
    // ◯
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
  onEnter(args) {
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
  onLeave(retval) {
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
    if (this.CommentData_TextReturn_Id === previous_CommentData_TextReturn_Id) {
      return null;
    }
    previous_CommentData_TextReturn_Id = this.CommentData_TextReturn_Id;

    const text = readString(retval);
    positionBottomHandler(text, true);
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
    const thiz = args[0].wrap();

    if (thiz.objNum === previous_objNum) {
      return null;
    }
    previous_objNum = thiz.objNum;

    console.log("onEnter: TeaRecipePrefab.SetDetail");

    const result = thiz.nameString.value + "\n" + thiz.detailString.value;
    DEBUG_LOGS && logText(result);
    handler(result);
  },
});

Mono.setHook("", "P06_material", "DetailTextSet", -1, {
  onEnter(args) {
    console.log("onEnter: P06_material.DetailTextSet");

    const text = readString(args[1]);
    if (text === "???") {
      return null;
    }

    handler(text);
  },
});

// P07_Character
// args[1] -> character id; 0x0 = taruto, 0x1 = makaron
Mono.setHook("", "CharaBoard", "DataSet", -1, {
  onEnter(args) {
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

    if (OPTIONS.fancyOutput) {
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
        text: description.replace(/―/g, "ー"),
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

      chara.description = description;

      chara.preferences = preferencesName
        .map((name, index) => `${name}　${preferencesInfo[index]}`)
        .join("\n");
    }

    const board = [chara.traits, chara.description, chara.preferences].join("\n\n");
    handler(board);
  },
});

//#endregion

trans.replace((s) => {
  DEBUG_LOGS && console.warn(JSON.stringify(s));

  return s
    .replace(/<\/?color[^\>]*>/g, "")
    .replace(/^\r?\n/g, "")
    .trimEnd();
});
