// ==UserScript==
// @name         [PCSG00490] 空の軌跡 the 3rd Evolution
// @version      1.0.0
// @author       tomrock645 
// @description  Vita3k (v0.1.9 3520)
// ==/UserScript==

console.warn("This was one of my first scripts, so it might be a bit scuffed at times.\n");
console.warn("Known issue:\n- A random line of text might get extracted on rare occasions.");

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
    0x8013a7d0: mainTextHandler.bind_(null, 5, 0, "main text"),
    0x8013a4ee: waitCommandHandler,
    0x8013a49a: waitCommandHandler,

    0x8013aa3c: nameHandler.bind_(null, 1, 0, "character name"),
    0x8013b516: miscHandler.bind_(null, 1, 0, "obtained item"), // For the few main text doesn't hook
    0x8013cafa: miscHandler.bind_(null, 0, 0, "place name"),
    0x8015cf88: miscHandler.bind_(null, 1, 0, "choices"), 
    0x8013f1b6: descriptionHandler.bind_(null, 5, 0, "orbment info"), // Quartz info and empty slots
    0x80135cea: descriptionHandler.bind_(null, 0, 0, "item info"), // Info on items that aren't quartz
    0x80140c0e: descriptionHandler.bind_(null, 5, 0, "option info"), // Most details in main menu and in shops, and craft info in main menu
    0x80140c0a: descriptionHandler.bind_(null, 5, 0, "game options"), // Also door requirements from the map
    0x8013f022: lootAndHandBooksHandler.bind_(null, 5, 0, "other text"), // new craft skill and most content from all handbooks
    0x80062a7e: lootAndHandBooksHandler.bind_(null, 6, 0, "battle loot"),
    0x801358aa: descriptionHandler.bind_(null, 5, 0, "arts info"),
    0x80021d16: descriptionHandler.bind_(null, 0, 0, "crafts info"), // In battles
    0x80117ee8: nameHandler.bind_(null, 1, 0, "quest name"), // In handbook
    0x801130e0: questHandler.bind_(null, 0, 0, "quests in handbook"), 
    0x80113260: questHandler.bind_(null, 6, 0, "quest progress"), // In handbook
    0x801133fe: nameHandler.bind_(null, 0, 0, "door name"), // In handbook,
    0x80113494: questHandler.bind_(null, 6, 0, "doors"), // In handbook,
    0x8010d854: nameHandler.bind_(null, 1, 0, "recipe name"),
    0x8010b93c: descriptionHandler.bind_(null, 0, 0, "recipe"),
});

let previousQuest = "";
let fullQuest = "";
let isQuestDisplayed = false;
let previousDescription = "";
let previousDoor = "";
let fullDoor = "";
function _questHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    const content = address.readShiftJisString();
    if (SHOW_HOOK_NAME) console.warn(hookName);

    // I don't know when the last progress hook and door hook get called (only the main quest content gets all hooked at once), 
    // so everything gets printed out from the descriptionHandler since the orbment hook is constantly called in the handbook for some reason
    switch(hookName) {
        case "quests in handbook":
            if (previousQuest !== questName) {
                previousQuest = questName;
                isQuestDisplayed = false;
                fullQuest = questName + " \n" + content + "\n\t\t\t・・・";
            }
            break;

        case "quest progress":
            if (!isQuestDisplayed) 
                    fullQuest += "\n" + content;
            
            break;

        case "doors":
            if(previousDoor !== doorName){
                if(fullDoor === "") {
                    fullDoor = doorName + "\n" + content;
                }
                else
                    fullDoor += "\n" + content;
            }
            break;
    }
    return null;
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

    if (hookName === "other text" && info.includes("【属性:") || /^.{1,3}：/.test(info))
        return null; // The hook overlaps with quartz and arts info

    if (hookName == "other text") {
        // To display these again when going back to them if they were the last selected (top of the list)
        previousQuest = "";
        previousDoor = "";
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
    infoContent = []; // Clear the loot content array
    isInfoDisplayed = false;
    fullInfo = "";
}

let gameOptions = ["表示する", "表示しない", "画面回転と同期", "北を上で固定", "45度単位", "フリー回転", "標準", "逆回転", "カーソル初期化", "カーソル記憶"];
let previousItem = ""; 
let previousQuartzOrSlot = ""; 
let previousArt = "";
let previousCraft = "";
let previousRecipe = "";
function _descriptionHandler(regs, index, offset, hookName) {
    const address = regs[index].value.add(offset);
    const description = address.readShiftJisString();
    if (SHOW_HOOK_NAME) console.warn(hookName);
    if (ENABLE_HEXDUMP) console.warn(hexdump(address));



    if (description === previousDescription || description === "攻撃力は期待できないが、ないよりマシ？")
        return null;

    previousDescription = description;

    if (hookName === "game options") {
        // To display the last selected item, art or craft when choosing the option again (in battle)
        // Hook overlaps with these, so using it to my advantage 
        previousItem = ""; 
        previousArt = "";
        previousCraft = "";

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

    switch (hookName){
        case "recipe":
            if(recipeName !== previousRecipe) {
                previousRecipe = recipeName;
                return recipeName + "\n" + description;
            }

            else
                return null;

        case "option info": 
            // To display these again when going back to them if they were the last selected (top of the list)
            previousQuartzOrSlot = ""; 
            previousItem = "";
            previousArt = "";
            break;

        case "item info":
            if(previousItem === description)
                return null;
    
            previousItem = description;
            break;

        case "arts info":
            if(previousArt === description)
                return null;
    
            previousArt = description;
            break;

        case "crafts info":
            if(previousCraft === description)
                return null;
    
            previousCraft = description;
            break;

        // Printing out the content of quests and doors (from handbook) here because I can't tell when their hooks get called for the last time (the don't hook the whole thing at once),
        // and the orbment info hooks gets constantly called in the handbook for some reason, so I'm using it to my advantage
        case "orbment info":
            if(fullQuest !== "" && !isQuestDisplayed) {
                let quest = fullQuest;
                fullQuest = "";
                isQuestDisplayed = true;
                return quest;
            }

            if(fullDoor !== ""){
                let door = fullDoor;
                previousDoor = doorName;
                fullDoor = "";
                return door;
            }

            if(!/^スロットレベル/.test(description) && !/^【属性:/.test(description))
                return null; // Hook overlaps with other hooks
    
            if(description !== previousQuartzOrSlot) {
                previousQuartzOrSlot = description;
                return description;
            }
    
            else
                return null;
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
let doorName = "";
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

        case "door name":
            doorName = address.readShiftJisString();
            break;
    }
}

let timer;
let gate = true;
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

    else
        s = readString(address, { showName: true, newLine: false });

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
                case 0x18:
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
        .replace(/^\d+$/, '') // discard messages when they only contain numbers
        .replace(/【氏\s名】/, "【氏名】")
        .replace(/【所\s属/, "【所属")
        .trim();
});
