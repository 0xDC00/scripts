// ==UserScript==
// @name         DRAGON QUEST VII Reimagined
// @version      DEMO
// @author       Mansive
// @description  Steam
// Only Japanese was tested
// https://store.steampowered.com/app/2499860/DRAGON_QUEST_VII_Reimagined/
// ==/UserScript==

const UE = require("./libUnrealEngine.js");
const __e = Process.enumerateModules()[0];

function getPatternAddress(name, pattern) {
  const results = Memory.scanSync(__e.base, __e.size, pattern);
  if (results.length === 0) {
    throw new Error(`[${name}] Hook not found!`);
  }

  let address = results[0].address;
  console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);
  if (results.length > 1) {
    console.warn(`${name} has ${results.length} results`);
  }

  return address;
}

// mysterious function from ender lilies
const hotHook = {
  name: "Main",
  pattern: "40 53 57 41 55 48 83 EC 30 45 ?? ED ?? ?? ?? 24",
  address: NULL,
  readString(regs) {
    return regs.rcx.readPointer().readUtf16String();
  },
};

hotHook.address = getPatternAddress(hotHook.name, hotHook.pattern);
const closeHook = UE.findFunction("/Script/DOLL.DOLLMessageWindowHUD:OnClose");

/**@type {string[]} */
const texts = [];
const textHistory = new Set();
let timer;

const blacklist = new Set([
  "はい",
  "いいえ",
  "/",
  ":",
  "Lv",
  "Uhr",
  "プレイ時間",
  "記録日時",
  "使用していません",
  "もどる",
  "おわる",
  "カナ",
])

// lazy number check
function isNumber(text) {
  const firstChar = text.at(0);
  const lastChar = text.at(-1);

  return (
    (firstChar >= "0" && firstChar <= "9") === true &&
    (lastChar >= "0" && lastChar <= "9") === true
  );
}

function isDirty(text) {
  return blacklist.has(text) || isNumber(text) || text.length === 1;
}

function scrollHandler() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const results = [];
    for (const text of texts) {
      if (textHistory.has(text)) {
        continue;
      }
      textHistory.add(text);

      if (isDirty(text)) {
        continue;
      }
      results.push(text);
    }

    trans.send(results.join("\r\n"));
    texts.length = 0;
  }, 600);
}


UE.setHook("/Script/DOLL.DOLLMessageWindowHUD:OnOpen", {
  onEnter(args) {
    console.warn("onEnter: onOpen");
    const hotHookTemp = Breakpoint.add(hotHook.address, {
      onEnter() {      
        /**@type {string} */
        const text = hotHook.readString(this.context);
        const previous = texts.at(-1);

        // log every text
        // console.warn(text);
        
        if (text === previous || isDirty(text)) {
          return;
        }
        else if (text.startsWith(previous) && text.length > previous.length) {
          texts[texts.length - 1] = text;
          scrollHandler();
        } else {
          texts.push(text);
          scrollHandler();
        }
      }
    });

    const closeHookTemp = Breakpoint.add(closeHook, {
      onEnter() {
        console.warn("onEnter: OnClose; detaching hot hook");
        texts.length = 0;
        Breakpoint.remove(hotHookTemp);
        Breakpoint.remove(closeHookTemp);
      }
    })
  },
});

// HOOK EVERYTHING YEEHAW
// const tempHook = Breakpoint.add(hotHook.address, {
//   onEnter() {
//     console.log("onEnter: tempHotHook");
//     const text = hotHook.readString(this.context);
//     console.warn(text);
//   }
// });

let previousBatch = ""
trans.replace((s) => {
  if (!s || s === previousBatch) {
    return null;
  }
  previousBatch = s;

  const lines = s.split("\r\n");

  s = s.trim();

  return s;
})

const candidates = [
  "/Script/DOLL.DOLLMessageWindowHUD:AddMessage",
  "/Script/DOLL.DOLLMessageWindowHUD:CloseDialogWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:ForceCloseChoicesListWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:ForceCloseYesNoWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:ForceEndMessage",
  "/Script/DOLL.DOLLMessageWindowHUD:GetChoicesListWindowSelectIndex",
  "/Script/DOLL.DOLLMessageWindowHUD:GetDialogWindowLineNum",
  "/Script/DOLL.DOLLMessageWindowHUD:IsEndTypingLastMessage",
  "/Script/DOLL.DOLLMessageWindowHUD:IsOpen",
  "/Script/DOLL.DOLLMessageWindowHUD:IsOpenChoicesListWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:IsOpenDialogWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:IsOpenYesNoWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:IsSelectYes",
  "/Script/DOLL.DOLLMessageWindowHUD:NextMessage",
  "/Script/DOLL.DOLLMessageWindowHUD:OnAllTypingEnd",
  "/Script/DOLL.DOLLMessageWindowHUD:OnCanNext",
  "/Script/DOLL.DOLLMessageWindowHUD:OnClose",
  "/Script/DOLL.DOLLMessageWindowHUD:OnCloseChoicesListWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:OnCloseYesNoWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:OnManualNext",
  "/Script/DOLL.DOLLMessageWindowHUD:OnNext",
  "/Script/DOLL.DOLLMessageWindowHUD:OnNextMessageTyping",
  "/Script/DOLL.DOLLMessageWindowHUD:OnOpen",
  "/Script/DOLL.DOLLMessageWindowHUD:OnPreNext",
  "/Script/DOLL.DOLLMessageWindowHUD:OnPreNextMessageTyping",
  "/Script/DOLL.DOLLMessageWindowHUD:OnTryToNext",
  "/Script/DOLL.DOLLMessageWindowHUD:OnTypingEnd",
  "/Script/DOLL.DOLLMessageWindowHUD:OpenChoicesListWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:OpenDialogWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:OpenYesNoWindow",
  "/Script/DOLL.DOLLMessageWindowHUD:SetCanNext",
  "/Script/DOLL.DOLLMessageWindowHUD:SetEnableTypingSkip",
  "/Script/DOLL.DOLLMessageWindowHUD:SetIsAutoClose",
  "/Script/DOLL.DOLLMessageWindowHUD:StartMessage",
  "/Script/DOLL.LevelSequenceEventDispatcher:DispMessage",
]

// which of the hook candidates are being triggered?
// for (const candidate of candidates) {
//   console.log("Trying", candidate);
//   UE.setHook(candidate, {
//     onEnter() {
//       console.log("onEnter:", candidate);
//     }
//   })
// }
