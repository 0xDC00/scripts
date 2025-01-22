// ==UserScript==
// @name         ENDER LILIES: Quietus of the Knights (エンダーリリーズ)
// @version      1.1.0+
// @author       Mansive
// @description  Steam
// * Live Wire, Adglobe
// * Binary Haze Interactive
// * Unreal Engine 4.26.2.0
//
// https://store.steampowered.com/app/1369630/ENDER_LILIES_Quietus_of_the_Knights/
// ==/UserScript==
const ui = require("./libUI.js");
const __e = Process.enumerateModules()[0];

const BACKTRACE = false;
const BACKTRACE_MODE = Backtracer.ACCURATE;
const INSPECT_ARGS = false;

const USER_OPTIONS = { ignoreSeenText: false, filterTrivialText: true };
const textHistory = new Set();

const texts = new Set();
let open = true;
let timer = null;
let openTimer = null;
let previousLine = "";
let previousBatch = "";

//#region Hooks

/** Gets every text. */
const hotHook = {
  name: "Main",
  pattern: "40 53 57 41 55 48 83 EC 30 45 33 ED 4C 89 64 24 68", // function prologue
  address: null,
  readString(regs) {
    return regs.rcx.readPointer().readUtf16String();
  },
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
      onEnter() {
        mainHandler(target.name, target.readString(this.context));
      },
    });
  } else if (USER_OPTIONS.ignoreSeenText === true) {
    Interceptor.attach(target.address, {
      onEnter() {
        const text = target.readString(this.context);

        if (textHistory.has(text) === false) {
          mainHandler(target.name, text);
          textHistory.add(text);
        }
      },
    });
  }

  return true;
}

//#endregion

//#region Misc

function startTrace() {
  console.warn("Tracing!!");

  const traceTarget = hotHook;
  const traceAddress = getPatternAddress(traceTarget.name, traceTarget.pattern);
  const previousTexts = new Set();

  Interceptor.attach(traceAddress, function (args) {
    const text = traceTarget.readString(this.context);
    const callstack = Thread.backtrace(this.context, BACKTRACE_MODE);

    console.log(`
    \rONENTER: ${traceTarget.name}
    \r${text}
    \rCallstack: ${callstack.splice(0, 16)}`);

    // console.warn(`RSP: ${this.context.rsp}`);
    if (INSPECT_ARGS === true) {
      inspectArgs(args);
    }
  });
}

function inspectArgs(args) {
  const argsTexts = [];

  for (let i = 0; i <= 20; i++) {
    argsTexts.push(`args[${i}]=${args[i]}`);
  }

  for (const text of argsTexts) {
    console.log(`\x1b[45m${text}\x1b[0m`);
  }

  argsTexts.length = 0;
}

// lazy number check
function isNumber(text) {
  const firstChar = text.at(0);
  const lastChar = text.at(-1);

  return (
    (firstChar >= "0" && firstChar <= "9") === true &&
    (lastChar >= "0" && lastChar <= "9") === true
  );
}

//#endregion

//#region Handlers

function genericHandler(name, text, delay = 200) {
  texts.add(text);

  clearTimeout(timer);
  timer = setTimeout(() => {
    trans.send([...texts].join("\r\n"));
    texts.clear();
  }, delay);
}

function refreshOpenTimer() {
  open = false;

  clearTimeout(openTimer);
  openTimer = setTimeout(() => {
    open = true;
  }, 10);
}

function cleanText(text) {
  // console.warn("before:", JSON.stringify(text));

  if (
    isNumber(text) === true ||
    text.at(0) === "×" ||
    /width|height|color|Binary/.test(text) === true ||
    /^<img id="[^"]+"\/>$/.test(text) === true ||
    /Press <img id="input\.\w+"\/> to start/.test(text) === true
  ) {
    return "";
  }

  if (USER_OPTIONS.filterTrivialText === true) {
    // skip titles of tips
    if (text.startsWith("No. ") === true && text.length < 18) {
      refreshOpenTimer();
      return "";
    }

    if (
      blacklist.has(text.split(/[:：]/)[0]) === true ||
      blacklist.has(text.replace(/^<img id="input\.\w+"\/>( )?/, "")) === true
    ) {
      return "";
    }
  }

  text = text.replace(/^<img id="input\.\w+"[^>]+(vcenter="\w+")?[^>]+\/>/, "");
  text = text.replace(/^<img id="[^"]+"\/>(?! \u2781)\/>/, "");

  // console.warn("after: ", JSON.stringify(text));

  return text;
}

function mainHandler(name, text) {
  if (open === false) {
    refreshOpenTimer();
    return null;
  } else if (text === previousLine || text === null) {
    return null;
  }

  previousLine = text;

  const result = cleanText(text);

  if (result !== "") {
    genericHandler(name, result);
  }
}

trans.replace((s) => {
  if (s === previousBatch) {
    return null;
  }
  previousBatch = s;

  s = s.replace(/<img id=("input\.\w+")\/>/g, "$1");
  s = s.replace(/"input\.[^"]+"/g, "▢");
  s = s.replace(/<[^>]+>/g, ""); // handle every other control code
  s = s.replace(/\n /g, "\n");

  return s.trim();
});

// what desperation looks like
// same strategy as ASTLIBRA Revision
// created after running around on 0% and 100% save files
const blacklist = new Set([
  "TEXT",
  "{0}としてプレイ中",
  "レベル ",
  "開始",
  "New game +",
  "新規作成",
  "破損したデータ",
  "Lv ",
  "Play Time ",
  "AAAAAAAAAAAAAAAAAAAA",
  "NG+ ",
  "Name",
  "Text sample",
  "+1",
  "OK",
  "ON",
  "OFF",
  "Records",
  "-",
  "はい",
  "いいえ",
  "キロク",
  "スキル",
  "メインスキル",
  "レリック",
  "コレクション",
  "TIPS",
  "Tip",
  "???",
  "New",
  "マップ",
  "セカイ",
  "チャプター",
  "プレイ時間",
  "Play time ",
  // "リリィの状態",
  "Lv.",
  "MAX",
  "Set",
  "使用回数",
  "リキャストタイム",
  "水中で発動可能",
  "使用スロット",
  "スロット",
  "セット中のスキル",
  "装備中のレリック",
  "アクション",
  "セーブ中…",
  "セーブしました",
  "ⅹ",
  "サブスキル",
  "猛る穢れの残滓",
  "古き墓守",
  "淀んだ穢れの残滓",
  "古き魂の残滓",
  "現在の所持数",
  "ゲームプレイ",
  "サウンド",
  "グラフィック",
  "コントローラー",
  "キーボード",
  "ボタンを押してください",
  "スキルセットの切り替え",
  "初期設定に戻す",
  "戻る",
  "現在地",
  "レストポイント",
  "遺されたものがあるエリア",
  "全て終えたエリア",
  "未開のルート",
  "通ったルート",
  "穢れの記憶",
  "戦いの記憶",
  "連戦の記憶",
  "Level up",
  "プレイ再開",
  "レストポイントに戻る",
  "実績",
  "設定",
  "タイトルに戻る",
  "スタート",
  "ゲーム終了",
  "終了",
  "確認",
  "閉じる",
  "キャンセル",
  "UIを隠す",
  "データ管理",
  "を押してプロフィールを切り替えます",
  "レコードを削除する",
  "ファストトラベル",
  "スキルのセット",
  "レリックの装備",
  "スキルの強化",
  "記憶",
  "チャレンジ",
  "記録する",
  "出発する",
  "説明の表示",
  "次のページ",
  "前のページ",
]);

//#region UI Config

ui.title = "ENDER LILIES";
ui.description = `
<small class='text-muted'>ENDER LILIES v1.1.0+
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
    help: `Filters out trivial text that tends to get spammed in menus,
    such as "閉じる", "戻る", or "TIPS".
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
  } else {
    attachHooks();
    uiStart();
  }
}

start();

//#endregion
