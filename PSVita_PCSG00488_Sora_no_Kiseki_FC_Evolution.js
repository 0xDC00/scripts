// ==UserScript==
// @name         [PCSG00488] 空の軌跡　FC　Evolution
// @version      1.0.0
// @author       tomrock645 (Koukdw and blacktide082 helped a ton, espcially Koukdw. Definitely wouldn't have been able to make the script without them.)
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

const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');

const SHOW_HOOK_NAME = false;
const ENABLE_HEXDUMP = false;

setHook({
    0x800b1668: nameHandler.bind_(null, 1, 0, "character name"),
    0x800b3606: miscHandler.bind_(null, 0, 0, "place name"),
    0x800f6902: miscHandler.bind_(null, 1, 0, "choices"), // Mostly dialogue choices
    0x800dc44a: descriptionHandler.bind_(null, 0, 0, "quartz info"),
    0x800dc65e: descriptionHandler.bind_(null, 0, 0, "item info"), // Info on items that aren't quartz
    0x800dfc4e: descriptionHandler.bind_(null, 5, 0, "option info"), // Most details in main menu and in shops
    0x800dc628: descriptionHandler.bind_(null, 4, 0, "option info"), // Empty orbment slots
    0x800de1ac: lootAndHandBooksHandler.bind_(null, 5, 0, "other text"), // new craft skill and most content from all handbooks
    0x8004b058: lootAndHandBooksHandler.bind_(null, 0, 0, "battle loot"),
    0x800dc3e6: descriptionHandler.bind_(null, 0, 0, "arts info"),
    0x800c5fec: nameHandler.bind_(null, 0, 0, "quest name"), // On quest board
    0x800e7332: questHandler.bind_(null, 6, 0, "quests on board"), 
    0x800a67f0: nameHandler.bind_(null, 1, 0, "quest name"), // In handbook
    0x800a6806: questHandler.bind_(null, 0, 0, "quests in handbook"), 
    0x800a6976: questHandler.bind_(null, 6, 0, "quest progress"), // In handbook
    0x800a15bc: nameHandler.bind_(null, 1, 0, "recipe name"),
    0x8009f7fa: descriptionHandler.bind_(null, 0, 0, "recipe"),

    //kdw stuff
    /**
     * This hook runs on every character, so we grab the first call to that address, and close the hook for all the other call until we reach the 0x2 command (waitKey)
     * At this point we can reopen the hook, we also reopen after 1.5 sec of having no text (this handle the case when there is no 0x2 command, rare but it happens)
     */
    0x800B13E2: mainTextHandler.bind_(null, 5, 0, "main text"),
    0x800B1100: waitCommandHandler,
    0x800B10AE: waitCommandHandler,
});

let gameOptions = ["表示する", "表示しない", "画面回転と同期", "北を上で固定", "45度単位", "フリー回転", "標準", "逆回転", "Evolution"];
let excludeFromQuest = "【氏 名】  エステル・ブライト  ヨシュア・ブライト【所 属】  ロレント支部【ランク】 依頼達成数: 獲得ＢＰ :【履歴】";

let previousQuest = "";
let questContent = [];
let fullQuest = "";
let isQuestDisplayed = false;
let previousDescription = "";
function _questHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    const content = address.readShiftJisString();
    if (SHOW_HOOK_NAME) console.warn(hookName);

    if(hookName === "quests on board" && previousDescription.includes(content) || contentIncludesAny(content, gameOptions) || previousText.includes(content))
        return null; // The hook overlaps with a few other hooks, so this is also to not print unnecessary stuff

    switch(hookName) {
        case "quests on board":
            if(previousQuest !== questName) {
                questContent = [];
                fullQuest = "";
                isQuestDisplayed = false;
                fullQuest = questName + "\n";
            }

            if(previousQuest === questName && isQuestDisplayed && questContent.includes(content)) 
                    return null;

            previousQuest = questName;

            if (questContent.includes(content) && isQuestDisplayed)
                return null;

            else if (questContent.includes(content) && !isQuestDisplayed) {
                isQuestDisplayed = true;
                questContent = [];

                if (fullQuest.replace(/\s/g, '') === excludeFromQuest.replace(/\s/g, ''))
                    return null;

                return fullQuest;
            }

            else {
                questContent.push(content);
                if (fullQuest.includes(content))
                    return null;

                fullQuest += content;
            }
            

            break;

        case "quests in handbook":
            if(previousQuest !== questName){
                questContent = [];
                fullQuest = "";
                isQuestDisplayed = false;
                fullQuest = questName + "\n" + content + "\n\t\t\t・・・";
                previousQuest = questName;
                questContent.push(content);
            }

            break;

        case "quest progress":
            if(previousQuest === questName && questContent.includes(content))
                return null;

            previousQuest = questName;

            if (questContent.includes(content) && isQuestDisplayed)
                return null;

            else if (questContent.includes(content) && !isQuestDisplayed) {
                isQuestDisplayed = true;
                questContent = [];
                return fullQuest;
            }

            else {
                questContent.push(content);
                fullQuest += "\n" + content;
            }

            break;
    }
    return null;
}

function contentIncludesAny(content, options) {
    return options.some(option => content.includes(option));
}


let infoContent = [];
let infoTimer = null;
let fullInfo = "";
let isInfoDisplayed = false;
const INFO_TIMEOUT_MS = 500; // Timer of 0.5 seconds to make sure the content doesn't carry over
function _lootAndHandBooksHandler(regs, index, offset, hookName) {
    if (SHOW_HOOK_NAME) console.warn(hookName);
    const address = regs[index].value.add(offset);
    let info = address.readShiftJisString();

    questName = ""; // To display the quest at the top of the list again if it was the last one selected

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
    infoContent = []; 
    isInfoDisplayed = false;
    fullInfo = "";
}

function _descriptionHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    const description = address.readShiftJisString();
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));

    if (description === previousDescription)
        return null;

    previousDescription = description;

    if (previousDescription.includes("工房"))
        return null;

    if (hookName === "recipe")
        return recipeName + "\n" + description;

    if (hookName === "option info") {
        switch(description) { // Game options from main menu and title screen
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

function handler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));
    const text = readString(address, { showName: false, newLine: true });

    return text;
}

function waitCommandHandler() {
    gate = true;
}

let previousName = "";
let questName = "";
let recipeName = "";
function nameHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    if (SHOW_HOOK_NAME) console.warn(hookName);

    switch (hookName) {
        case "character name":
            previousName = address.readShiftJisString();
            break;

        case "quest name":
            questName = address.readShiftJisString();
            break;

        case "recipe name":
            recipeName = address.readShiftJisString();
            break;
    }
}

let timer;
let gate = true;
let previousText = "";
function mainTextHandler(regs, index, offset, hookName) {
    if (!gate) return;
    gate = false;
    let address = regs[index].value;
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));
    let s = readString(address, { showName: true, newLine: false });

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

    if(previousText.includes(s) && previousText.length - s.length >= 1)
        return ""; // Somehow the same message can be extracted twice in a row but one character shorter

    previousText = s;

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
        .replace(/【報\s酬】/, "【報酬】")
        .replace(/【氏\s名】/, "【氏名】")
        .replace(/【所\s属/, "【所属")
        .trim();
});
