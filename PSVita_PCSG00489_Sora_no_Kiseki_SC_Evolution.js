// ==UserScript==
// @name         [PCSG00489] 空の軌跡　SC　Evolution
// @version      1.0.0
// @author       tomrock645
// @description  Vita3k (v0.1.9 3520)
// ==/UserScript==

console.warn("This was one of my first scripts, so it might be a bit scuffed at times.\n");
console.warn("Known issues:\n- Do not open the conversation log. The script makes the game run at ~3 FPS when it's on screen.");
console.warn("- Opening the world map will make the game run at ~16 FPS.");
console.warn("- A random line of text might get extracted on rare occasions.");

const { setHook } = require("./libVita3k.js");

const miscHandler = trans.send(handler, 200);
const descriptionHandler = trans.send(_descriptionHandler);
const lootAndHandBooksHandler = trans.send(_lootAndHandBooksHandler);
const questHandler = trans.send(_questHandler);
const nameHandler = trans.send(_nameHandler);

const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');

const SHOW_HOOK_NAME = false;
const ENABLE_HEXDUMP = false;

setHook({
    0x801191c6: mainTextHandler.bind_(null, 5, 0, "main text"),
    0x80118ee4: waitCommandHandler,
    0x80118e90: waitCommandHandler,

    0x80119450: nameHandler.bind_(null, 1, 0, "character name"),
    0x8011a090: miscHandler.bind_(null, 5, 0, "obtained item"), // For the few main text doesn't hook
    0x8011b4f4: miscHandler.bind_(null, 0, 0, "place name"),
    0x8013cc4e: miscHandler.bind_(null, 1, 0, "choices"),
    0x8011dcde: descriptionHandler.bind_(null, 5, 0, "quartz & arts info"),
    0x8011432c: descriptionHandler.bind_(null, 0, 0, "craft info"), // During battle
    0x801146f0: descriptionHandler.bind_(null, 1, 0, "item info"), // Info on items that aren't quartz
    0x8011f68c: descriptionHandler.bind_(null, 5, 0, "option info"), // Game options from title screen and main menu, and equipment info
    0x8011f690: descriptionHandler.bind_(null, 5, 0, "option info"), // Most details in main menu and in shops
    0x801146ac: descriptionHandler.bind_(null, 4, 0, "option info"), // Empty orbment slots
    0x8011db6e: lootAndHandBooksHandler.bind_(null, 5, 0, "other text"), // new craft skill and most content from all handbooks
    0x80056ef2: lootAndHandBooksHandler.bind_(null, 6, 0, "battle loot"),
    0x800ef802: nameHandler.bind_(null, 1, 0, "quest name"), // On quest board
    0x800ef7a6: questHandler.bind_(null, 0, 0, "quests"), // On board and in handbook
    0x800e94fe: nameHandler.bind_(null, 1, 0, "quest name"), // In handbook
    0x800e968e: questHandler.bind_(null, 6, 0, "quest progress"), // In handbook
    0x800e1e48: nameHandler.bind_(null, 1, 0, "recipe name"),
    0x800b6eea: descriptionHandler.bind_(null, 0, 0, "recipe"),
});

let previousQuest = "";
let fullProgress = "";
let isQuestDisplayed = false;
let previousDescription = "";
function _questHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    const content = address.readShiftJisString();
    if (SHOW_HOOK_NAME)console.warn(hookName);

    if (hookName === "quests" && previousQuest !== questName) {
        previousQuest = questName;
        isQuestDisplayed = false;
        return questName + "\n" + content;
    }

    // Printing a quest's progress from the name handler function because I don't know when the progress hook is called for the last time and the name hook is called a few times for some reason,
    // so using the few extra name calls to my advantage and print the progress from there
    else if (hookName === "quest progress" && !isQuestDisplayed) {
        if (fullProgress == "")
            fullProgress = "\n" + content;
        else
            fullProgress += "\n" + content;

        return null;
    }

    return null;
}

let infoContent = [];
let infoTimer = null;
let fullInfo = "";
let isInfoDisplayed = false;
const INFO_TIMEOUT_MS = 500; // Timer of 0.5 seconds to make sure the content doesn't carry over
function _lootAndHandBooksHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    let info = address.readShiftJisString();
    if (SHOW_HOOK_NAME) console.warn(hookName);

    if(info.includes("を修得した。")) { // When obtaining a new craft in case at least two characters get a new one
        if(!infoContent.includes(info)) { 
            infoContent.push(info);
            return info;
        }
    
        if(infoContent.includes(info)) { 
            resetInfoTimer();
            return null;
        }
    }

    if (hookName === "other text")
        previousQuest = ""; // To display the quest at the top of the list again if it was the last one selected (in handbook)

    if (hookName === "other text" && info.includes("【属性:") || /^.{1,3}：/.test(info))
        return null; // The hook overlaps with quartz and arts info

    if (infoContent.includes(info) && isInfoDisplayed) {
        resetInfoTimer();
        return null;
    }

    else if (infoContent.includes(info) && !isInfoDisplayed) {
        isInfoDisplayed = true;
        return fullInfo;
    }

    else {
        resetInfoTimer();
        infoContent.push(info);
        fullInfo += "\n" + info;
    }

    return null;
}

function resetInfoTimer() {
    // Setting a new timer so that we don't print the info again in case the player stays on one of the relevant screen for some time
    clearTimeout(infoTimer);
    infoTimer = setTimeout(clearInfoContent, INFO_TIMEOUT_MS);
}

function clearInfoContent() {
    infoContent = []; // Clear the loot content array
    isInfoDisplayed = false;
    fullInfo = "";
}

let gameOptions = ["表示する", "表示しない", "画面回転と同期", "北を上で固定", "45度単位", "フリー回転", "標準", "逆回転", "カーソル初期化", "カーソル記憶"];
function _descriptionHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    const description = address.readShiftJisString();
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));

    if (hookName === "quartz & arts info" && !/^【.{1,5}:/.test(description))
        return null; // Hook overlaps with the 'choices' one.

    if (description === previousDescription)
        return null;

    previousDescription = description;

    if (hookName === "recipe")
        return recipeName + "\n" + description;

    if (hookName === "option info") {
        switch (description) { // Game options from main menu and title screen
            case "画面下のミニステータスの表示を切り替えます。":
                return "ステータス\t" + gameOptions[0] + "\t" + gameOptions[1] + "\n" + description;

            case "画面右上のミニマップの表示を切り替えます。":
                return "ミニマップ\t" + gameOptions[0] + "\t" + gameOptions[1] + "\n" + description;

            case "画面右上のミニマップの回転方法を切り替えます。":
                return "ミニマップ回転\t" + gameOptions[2] + "\t" + gameOptions[3] + "\n" + description;

            case "ゲーム内カメラの回転方式を切り替えます。":
                return "カメラ方式\t" + gameOptions[4] + "\t" + gameOptions[5] + "\n" + description;

            case "ゲーム内カメラの回転方向を切り替えます。":
                return "カメラ回転\t" + gameOptions[6] + "\t\t" + gameOptions[7] + "\n" + description;

            case "戦闘メニューのカーソル動作を切り替えます。":
                return "戦闘メニュー\t" + gameOptions[8] + "\t" + gameOptions[9] + "\n" + description;

            case "ゲーム中に流れるＢＧＭを切り替えます。\nＤＬＣを購入した場合のみ、切り替えることができます。":
                return "ＢＧＭ切替\n" + description;

            case "ＢＧＭの音量を変更します。":
                return "ＢＧＭ音量\n" + description;

            case "ボイスを除いた、効果音の音量を調整します。":
                return "効果音音量\n" + description;

            case "ボイスの音量を調整します。":
                return "ボイス音量\n" + description;

            default:
                return description;
        }
    }

    return description;
}

let haveObtainedItem = false;
let obtainedItem = "";
function handler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));
    const text = readString(address, { showName: false, newLine: true });

    if (hookName === "obtained item") {
        if (text === "強化ブーツ") // Skipping this one due to the game using the same textbox twice in a row (0x2 makes the item hook act late), happens early game
            return null;

        haveObtainedItem = true;
        obtainedItem = text;
        return null;
    }

    return text;
}

function waitCommandHandler() {
    gate = true;
}

let previousName = "";
let questName = "";
let recipeName = "";
function _nameHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    if (SHOW_HOOK_NAME) console.warn(hookName);
    //console.warn(hookName);

    /* 
    * The quest name hook is called a few times when handbook in the quest section is opened, so using this to my advantage to print out a quest's progress as one message from here
    *  I can't find a way to combine a quest's main content and the progress together like in Sky FC since the quest hooks for SC are called only when necessary, 
    * as opposed to FC where the hooks are constantly being called
    */
    if (fullProgress !== "" && !isQuestDisplayed) {
        let quest = fullProgress;
        questName = address.readShiftJisString();
        fullProgress = "";
        isQuestDisplayed = true;
        return quest;
    }

    switch (hookName) {
        case "character name":
            previousName = address.readShiftJisString();
            return null;

        case "quest name":
            questName = address.readShiftJisString();
            return null;

        case "recipe name":
            recipeName = address.readShiftJisString();
            return null;
    }
}

let timer;
let gate = true;
let previousText = "";
function mainTextHandler(regs, index, offset, hookName) {
    if (!gate) return;
    gate = false;
    let address = regs[index].value;
    let s = null;
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));

    if (haveObtainedItem) {
        s = obtainedItem + readString(address, { showName: true, newLine: false });
        haveObtainedItem = false;
    }

    else if (previousText === "強化レザーを装備した。") { // Hardcoding the item name to the main text that gets skipped due to the game using the same textbox twice in a row (0x2 makes the item hook act late)
        s = "強化ブーツ" + readString(address, { showName: true, newLine: false });
        previousText = "";
    }

    else
        s = readString(address, { showName: true, newLine: false });

    if (s === "強化レザーを装備した。")
        previousText = s;

    trans.send(s);
    // force open the gate after 4 sec of no text
    clearTimeout(timer);
    timer = setTimeout(() => {
        gate = true;
    }, 4000);
}

function readString(address, options) {
    let s = "", c;
    const buf = new Uint8Array(2);
    let nameShouldBeEmpty = false;
    while ((c = address.readU8())) {
        if (c == 0x2) {
            if (address.add(1).readU8() == 0x0) {
                nameShouldBeEmpty = true;
            }
            break;
        }
        // Decode characters
        if (c >= 0x20) {
            buf[0] = c;
            buf[1] = address.add(1).readU8();
            c = decoder.decode(buf)[0]; // ShiftJIS: 1->2 bytes.
            s += c;
            address = address.add(encoder.encode(c).byteLength);
        }
        // Handle special commands
        else {
            switch (c) {
                case 0x1:
                case 0xa:
                    address = address.add(1);
                    if (options.newLine) s += "\n";
                    else s += " ";
                    continue;
                case 0x3:
                case 0x4:
                case 0x5:
                case 0x6:
                case 0x9:
                    address = address.add(1);
                    continue;
                case 0x7:
                    address = address.add(2);
                    continue;
                case 0x1f:
                case 0xb:
                    address = address.add(3);
                    continue;
                default:
                    console.warn(`unhandled code: ${ptr(c)}`);
                    console.log(hexdump(address));
                    address = address.add(1);
                    continue;
            }
        }
    }
    if (previousName !== "" && options.showName) {
        s = previousName + "\n" + s;
    }
    if (nameShouldBeEmpty) {
        previousName = "";
    }
    return s;
}

trans.replace(function (s) {
    return s
        .replaceAll(/[　]+/g, ' ')
        .replace(/#[0-9]+R[^#]+#/g, '') // remove ruby
        .replace(/#[0-9]+[A-z]/g, '')   // remove control codes
        .replace(/[0-9]{4}[A-z]/g, '')   // remove control codes 
        .replace(/\\n/g, '\n')      // make the extracted '\n' actually act as a new line
        .replace(/\b\d{1,2}\/\s\d{1,2}\b/g, '') // remove things like '5/ 0' on recipe page
        .replace(/\b\d{1,2}\/\d{1,2}\b/g, '') // remove things like '5/10' on recipe page
        .replace(/【氏\s名】/, "【氏名】")
        .replace(/【所\s属/, "【所属")
        .trim();
});
