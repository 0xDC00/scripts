// ==UserScript==
// @name         ASTLIBRA Revision
// @version      Base 1.3.4+; DLC 1.0.9+
// @author       Mansive
// @description  Steam
// * KEIZO
// * Whisper Games
//
// https://store.steampowered.com/app/1718570/ASTLIBRA_Revision/
// ==/UserScript==
const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];

const BACKTRACE = false;
const INSPECT_ARGS = false;

const USER_OPTIONS = { ignoreSeenText: false, filterTrivialText: true };
const textHistory = new Set();

const texts = new Set();
const cycle = new Map();
let timer = null;
let isCycle = true;
let previous = "";

//#region Hooks

/** Runs on every frame */
const hotHook = {
  name: "Main",
  pattern: "48 ?? ?? ?? ?? 41 ?? 41 ?? 44 ?? ?? ???????? 4C ?? ?? 41",
  address: null,
  readString(regs) {
    return regs.rcx.readUtf8String();
  }, // E8 C30B0100
};

//#endregion
//#region Attach

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

function attachHooks() {
  console.warn("Attaching...");

  const target = hotHook;
  target.address = getPatternAddress(target.name, target.pattern);

  if (USER_OPTIONS.ignoreSeenText === false) {
    Interceptor.attach(target.address, {
      onLeave(retval) {
        cycleHandler(target.name, retval.readUtf8String());
      },
    });
  } else if (USER_OPTIONS.ignoreSeenText === true) {
    Interceptor.attach(target.address, {
      onLeave(retval) {
        const text = retval.readUtf8String();
        if (textHistory.has(text) === false) {
          cycleHandler(target.name, text);
          textHistory.add(text);
        }
      },
    });
  }

  return true;
}

//#endregion
//#region Miscellaneous

function inspectArgs(args) {
  const argsTexts = [];

  for (let i = 0; i <= 20; i++) {
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

//#endregion

//#region Handlers

function filterHandler(text) {
  texts.add(text);

  clearTimeout(timer);
  timer = setTimeout(() => {
    let result = "";
    const textsArray = [...texts];

    if (USER_OPTIONS.filterTrivialText === true) {
      for (const text of textsArray) {
        // console.warn(`"${text}",`);
        if (blacklistLines.has(text.trim()) === false) {
          result += text + "\r\n";
        }
      }
    } else if (USER_OPTIONS.filterTrivialText === false) {
      result = textsArray.join("\r\n");
    } else {
      throw new Error("What");
    }

    trans.send(result);
    isCycle = true;
    texts.clear();
  }, 200);
}

/**
 * There are 5 possible text patterns (where each letter is a different line):
 * 1. AAABBBCCC
 * 2. AAAABBBCCC
 * 3. ABCABCABC
 * 4. AAAAAAAAA
 * 5. A
 *
 * Excluding #5, each text pattern loops indefinitely in a cycle.
 * If any line of text repeats 7 times or no new text is added within time,
 * it's determined that a cycle exists,
 * and outputs all text in the cycle with deduplication.
 */
function cycleHandler(name, text) {
  if (cycle.has(text) === false) {
    if (text === "None") {
      return null;
    }

    if (isCycle === true) {
      isCycle = false;
      cycle.clear();
    }

    cycle.set(text, { occurrences: 1 });
    filterHandler(text);
  } else {
    if (isCycle === true) {
      return null;
    }

    const textStats = cycle.get(text);
    textStats.occurrences += 1;

    if (textStats.occurrences >= 7) {
      console.log("onEnter:", name);

      isCycle = true;
      texts.clear();

      const cycleTexts = cycle.keys();

      for (const text of cycleTexts) {
        filterHandler(text);
      }
    }
  }
}

trans.replace((s) => {
  if (s === previous || s === "") {
    return null;
  }
  previous = s;

  // console.warn(JSON.stringify(s));

  return s
    .replace(/^\n/, "")
    .replace(/(\r\n)?はい\r\nいいえ/g, "")
    .replace(/@BT_\w+/g, "▢")
    .replace(/@\^@&/g, "\r\n")
    .replace(/@./g, "")
    .replace(/セット[不可].+\r\n/g, "")
    .replace(/-(\r\n)?/g, "")
    .replace(/%\w/g, "")
    .trimEnd();
});

// Lazily hardcoded, but fast
const blacklistLines = new Set([
  "Trial",
  "In Game",
  "Original",
  "@BT_OK決定　@BT_NOキャンセル",
  "@BT_OK : 再生   @BT_SK : 停止   @BT_NO : 戻る",
  "@BT_SP データ削除",
  "作曲：",
  "@BT_OK ： 決定",
  "基本型",
  "消費する",
  "消費しない",
  "攻撃力 ：",
  "レンジ ：",
  "取回し ：",
  "重量　 ：",
  "最大HP ：",
  "最大ST ：",
  "魔導力 ：",
  "防御力 ：",
  "ガード ：",
  "重量   ：",
  "全耐性 ：",
  "最大HP：",
  "最大ST：",
  "魔導力：",
  "防御力：",
  "攻撃力：",
  "素早さ：",
  "幸運  ：",
  "適応力：",
  "ガード：",
  "総重量：",
  "耐猛毒：",
  "耐出血：",
  "耐石化：",
  "耐麻痺：",
  "耐暗闇：",
  "探索型",
  "武器攻撃型",
  "防御型",
  "憑依技型",
  "属性・状態型",
  "スキル変化型",
  "特殊型",
  "@BT_OK ： 表示変更",
  "@BT_SP：全回収",
  "ＥＸＰ",
  "難易度",
  "Normal",
  "Level",
  "Total Status",
  "@BT_L / @BT_R 設定変更",
  "言語設定 (Language)",
  "ＢＧＭ音量",
  "ＳＥ音量",
  "ＣＶ音量",
  "コントローラ振動設定",
  "コントローラボタン設定",
  "点滅軽減",
  "キーボードボタン設定",
  "画面モード",
  "解像度",
  "FPS",
  "使用モニター",
  "起動時にエフェクト全読み込み",
  "難易度",
  "タイトルへ戻る",
  "日本語",
  "ＯＮ",
  "ＷＩＮＤＯＷ",
  "仮想ＦＵＬＬ　ＳＣＲＥＥＮ",
  "ＦＵＬＬ　ＳＣＲＥＥＮ",
  "ＯＦＦ",
  "Easy",
  "Light",
  "Normal",
  "Hard",
  "Hell",
  "Impossible",
  "-  SHOP  -",
  "商品  購入",
  "Price",
  "NO DATA",
  "：",
  "所持数",
  "RARE ITEM !",
  "セーブする場所を選択してください。",
  // GAIDEN
  "：スタイル",
  "：天秤",
  "：魔石",
  "：装備",
  "：カード",
  "：GROW",
  "@BT_SP ： 固有技表示へ切り替え",
  "なし",
  "魔法LV",
  "宝",
  "現在地",
  "フォース不足",
  "習得可能",
  "Lock",
  "鍵が必要",
  "@BT_SP：フォース変換",
  "魔法型",
  "ChargeTime:",
  "Style Parameters",
  "@BT_SP ： 熟練度表示へ切り替え",
]);

//#endregion
//#region UI Config

ui.title = "ASTLIBRA Revision";
ui.description = `
<small class='text-muted'>ASTLIBRA Revision v1.3.4+
<br>ASTLIBRA Revision GAIDEN v1.0.9+
<br>Designed for Japanese (日本語).</small>
<br>Configure script behavior.`;
ui.options = [
  {
    id: "ignoreSeenText",
    type: "checkbox",
    label: "Ignore Already-seen Text",
    help: `Ignores or skips text that has already been outputted.
    <br>Greatly reduces spam, but might prevent you from seeing your desired text.
    <br><em>Recommended to leave <strong>disabled.</strong></em>`,
    defaultValue: false,
  },
  {
    id: "filterTrivialText",
    type: "checkbox",
    label: "Filter Trivial Text",
    help: `Filters out trivial text that tends to get spammed in menus or windows, 
    such as "消費する", "NO DATA", or "ＢＧＭ音量".
    <br><em>Recommended to leave <strong>enabled.</strong></em>`,
    defaultValue: true,
  },
];

ui.onchange = (id, current, previous) => {
  if (id === "ignoreSeenText") {
    console.log(
      `\x1b[2m"Ignore Already-seen Text" has been set to ${current}\x1b[0m`
    );

    USER_OPTIONS.ignoreSeenText = current;
    textHistory.clear();
    Interceptor.detachAll();
    Interceptor.flush();
    attachHooks();
  } else if (id === "filterTrivialText") {
    console.log(
      `\x1b[2m"Filter Trivial Text" has been set to ${current}\x1b[0m`
    );

    USER_OPTIONS.filterTrivialText = current;
  } else {
    console.warn("Unidentified UI ID!");
  }
};

function uiStart() {
  ui.open()
    .then(() => {
      console.log("UI loaded!");
    })
    .catch((err) => {
      console.error("UI error\n" + err.stacks);
    });
}

//#endregion
//#region Start

function start() {
  if (BACKTRACE === true) {
    startTrace();
  } else if (BACKTRACE === false) {
    attachHooks();
    uiStart();
  } else {
    throw new Error("Funky");
  }
}

start();

//#endregion
