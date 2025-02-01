// ==UserScript==
// @name         Death end re;Quest
// @version      
// @author       Tom (tomrock645)
// @description  GOG, Steam
// * developer   Idea Factory, compile Heart
// * publisher   Idea Factory International
//
// https://www.gog.com/en/game/death_end_request
// https://store.steampowered.com/app/990050/Death_end_reQuest/
// ==/UserScript==


console.warn("Most text gets extracted but there's still some I couldn't find a hook for, so an OCR tool might be needed at times (I use YomiNinja)");
console.warn("Known issues:\n- When skipping an event, the last text of that event will be extracted.");
console.warn("- If you load a save file that was saved mid-dialogue, some of the previous messages in that event will be extracted.")

const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 300);
const secondaryHandler = trans.send(s => s, '200+');

const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');


let isNamed = false;
let currentName = "";
(function () {
    const nameSig = 'e8 ?? ?? ?? ?? eb ?? e8 ?? ?? ?? ?? 80 bf';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: name");
        isNamed = true;

        const nameAddress = this.context.rcx;
        currentName = nameAddress.readUtf8String();

    })
})();


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? ?? 8b 4b 48 ?? 8d ?? ?? 20 ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, dialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[dialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[dialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: dialogue");

        const dialogueAddress = this.context.rsi;
        let currentText = dialogueAddress.readUtf8String();

        if (!isNamed)
            mainHandler(currentText);

        else {
            mainHandler(currentName + "\n" + currentText);
            isNamed = false; // Set to false in case the next line of text doesn't call the name signature
        }
    })
})();


(function () {
    const choicesSig = 'e8 ?? ?? ?? ?? 33 ff ?? 83 c3 18'
    var results = Memory.scanSync(__e.base, __e.size, choicesSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[choicesPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[choicesPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices");

        const choicesAddress = this.context.rdx;
        let choices = choicesAddress.readUtf8String();

        choices = readString(choicesAddress, "choices").trim();
        mainHandler(choices);
    })
})();



(function () {
    const menuInformationSig = 'e8 ?? ?? ?? ?? eb ?? ?? 8d 88 80 00 00 00 e8';
    var results = Memory.scanSync(__e.base, __e.size, menuInformationSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuInformationPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuInformationPattern] Found hook', address);
    Interceptor.attach(address, function (args) {

        const menuInformationAddress = this.context.rdx;
        let menuInformation = menuInformationAddress.readUtf8String();
        menuInformation = cleanText(menuInformation).trim();
        hardcodeMenuInformation(menuInformation);
        mainHandler(menuInformation);

    })
})();


(function () {
    const menuIconDescriptionSig = 'e8 01 7e 1b 00';
    var results = Memory.scanSync(__e.base, __e.size, menuIconDescriptionSig);
    //console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuIconDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuIconDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuicondescription");

        const menuIconDescriptionAddress = this.context.rdx;
        let menuIconDescription = menuIconDescriptionAddress.readUtf8String();

        mainHandler(menuIconDescription);
    })
})();


(function () {
    const menuPopUpSig = 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 8b c7 ?? 8b 6c';
    var results = Memory.scanSync(__e.base, __e.size, menuPopUpSig);
    //console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuPopUpPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuPopUpPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuPopUp");

        const menuPopUpAddress = this.context.rbp;
        let menuPopUp = menuPopUpAddress.readUtf8String();
        menuPopUp = cleanText(menuPopUp);

        mainHandler(menuPopUp);
    })
})();


(function () {
    const tipsSig = '0f 84 ?? ?? ?? ?? b9 43 00 00 00 ?? 89 74 ?? ?? e8';
    var results = Memory.scanSync(__e.base, __e.size, tipsSig);
    //console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tipsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tipsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tips");

        const tipsAddress = this.context.rcx;
        let tips = tipsAddress.readUtf8String();
        ;
        tips = cleanText(tips);

        let tipsName = readString(tipsAddress, "tips");
        tipsName = cleanText(tipsName);

        mainHandler(tipsName + "\n--------------------\n" + tips);
    })
})();


(function () {
    const helpSig = 'e8 ?? ?? ?? ?? ?? 89 7b 08?? 85 ff ?? 8b bc ?? ?? ?? ?? ?? 74'
    var results = Memory.scanSync(__e.base, __e.size, helpSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[helpPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[helpPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: help");

        const helpAddress = this.context.rdx;
        let help = helpAddress.readUtf8String();
        help = cleanText(help);
        mainHandler(help);
    })
})();


(function () {
    const itemListSig = 'e8 ?? ?? ?? ?? 0f 28 b4 ?? ?? ?? ?? ?? 0f 28 bc ?? ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, itemListSig);
    //console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemListPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemListPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemList");

        const itemListAddress = this.context.rdi;
        let itemDescription = itemListAddress.readUtf8String();

        itemDescription = cleanText(itemDescription);
        mainHandler(itemDescription);
    })
})();


(function () {
    const skillDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8d ?? ?? 20 e8 ?? ?? ?? ?? 81 4c ?? ?? 00 00 80 00 f3 0f 10 35';
    var results = Memory.scanSync(__e.base, __e.size, skillDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[skillDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[skillDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: skillDescription");

        const skillDescriptionAddress = this.context.rdx;
        let skillDescription = skillDescriptionAddress.readUtf8String();

        skillDescription = skillDescription;
        skillDescription = cleanText(skillDescription);

        mainHandler(skillDescription);
    })
})();


(function () {
    const episodeChartSig = 'e8 ?? ?? ?? ?? 8b 8f 04';
    var results = Memory.scanSync(__e.base, __e.size, episodeChartSig);
    //console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[episodeChartPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[episodeChartPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: episodechart");

        const episodeChartAddress = this.context.rdx;
        let episodeChart = episodeChartAddress.readUtf8String();

        episodeChart = episodeChart.replace(/#Pos\[@,56\]/g, "\n--------------------\n");

        mainHandler(episodeChart);
    })
})();


(function () {
    const irlMapSig = 'e8 ?? ?? ?? ?? ?? 8b 4e 10 ?? 85 c9 74 ?? 66 0f 6e 56 58 66 0f 6e 4e 54 0f 5b d2 0f 5b c9 e8 ?? ?? ?? ?? ?? 8b 4e 10 ?? 8d 96 90 00 00 00 e8 ?? ?? ?? ?? ?? 85 db 74 ?? ?? 8b 7b 18';
    var results = Memory.scanSync(__e.base, __e.size, irlMapSig);
    //console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[irlMapPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[irlMapPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: irlMap");

        const irlMapAddress = this.context.rax;
        let irlMap = readString(irlMapAddress, "irlMap");
        mainHandler(irlMap);
    })
})();


(function () { // For the warp screen unlocked in chapter 7
    const overworldMapSig = 'e8 bf 84 15 00 ?? 83 7b 60 00';
    var results = Memory.scanSync(__e.base, __e.size, overworldMapSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[overworldMapPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[overworldMapPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: overworldMap");

        const overworldMapAddress = this.context.rdx;
        let overworldMapName = readString(overworldMapAddress, "overworldMap");
        overworldMapName = cleanText(overworldMapName);

        let overWorldDetails = overworldMapAddress.readUtf8String();
        mainHandler(overworldMapName + "\n--------------------\n" + overWorldDetails);
    })
})();


(function () { // pop ups related to the camp
    const campSig = 'e8 ?? ?? ?? ?? ?? 8b 4b 48 e8 ?? ?? ?? ?? ?? 8b 4b 48 0f 28 f0';
    var results = Memory.scanSync(__e.base, __e.size, campSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[campPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[campPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: camp");

        const campAddress = this.context.rdx;
        let camp = campAddress.readUtf8String();
        camp = cleanText(camp);
        mainHandler(camp);
    })
})();


(function () {
    const campDialogueSig = 'e8 ?? ?? ?? ?? eb ?? ?? 8d 88 90 01 00 00 e8';
    var results = Memory.scanSync(__e.base, __e.size, campDialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[campDialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[campDialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: campDialogue");

        const campDialogueAddress = this.context.rdx;
        let campDialogue = campDialogueAddress.readUtf8String();
        campDialogue = cleanText(campDialogue);
        mainHandler(campDialogue);
    })
})();


(function () {
    const questsSig = 'e8 ?? ?? ?? ?? ?? 83 7f 30 00 f3 0f';
    var results = Memory.scanSync(__e.base, __e.size, questsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quests");

        const questsAddress = this.context.rdx;
        let quests = readString(questsAddress, "quests");
        quests = cleanText(quests);
        mainHandler(quests);
    })
})();


(function () {
    const difficultySig = 'e8 23 a1 15 00';
    var results = Memory.scanSync(__e.base, __e.size, difficultySig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[difficultyPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[difficultyPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: difficulty");

        const difficultyAddress = this.context.rdx;
        let difficulty = difficultyAddress.readUtf8String();
        difficulty = cleanText(difficulty);
        mainHandler(difficulty);
    })
})();


(function () { // Irl main menu. I can't find a hook for the one from the battle select command screen
    const battleJackMenuSig = 'e8 91 4f b4 ff';
    var results = Memory.scanSync(__e.base, __e.size, battleJackMenuSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[battleJackMenuPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[battleJackMenuPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: battleJackMenu");

        const battleJackMenuAddress = this.context.r8;
        let battleJackMenu = battleJackMenuAddress.readUtf8String();
        battleJackMenu = cleanText(battleJackMenu);
        mainHandler(battleJackMenu);
    })
})();


(function () { 
    const battleJackUpgradeSig = 'e8 ?? ?? ?? ?? ?? 39 73 58 75';
    var results = Memory.scanSync(__e.base, __e.size, battleJackUpgradeSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[battleJackUpgradePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[battleJackUpgradePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: battleJackUpgrade");

        const battleJackUpgradeAddress = this.context.rdx;
        let battleJackUpgrade = battleJackUpgradeAddress.readUtf8String();
        battleJackUpgrade = cleanText(battleJackUpgrade);
        mainHandler(battleJackUpgrade);
    })
})();


(function () {
    const summonSig = 'e8 ?? ?? ?? ?? 8b 87 04 02 00 00 85';
    var results = Memory.scanSync(__e.base, __e.size, summonSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[summonPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[summonPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: summon");

        const summonAddress = this.context.rdx;
        let summon = summonAddress.readUtf8String();
        // summon = cleanText(summon);
        mainHandler(summon);
    })
})();


(function () {
    const summonUpgradeSig = 'e8 ?? ?? ?? ?? f3 0f 10 35 ?? ?? ?? ?? ?? 8d 9e d0 00 00 00';
    var results = Memory.scanSync(__e.base, __e.size, summonUpgradeSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[summonUpgradePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[summonUpgradePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: summonUpgrade");

        const summonUpgradeAddress = this.context.rdx;
        let summonUpgrade = summonUpgradeAddress.readUtf8String();
        summonUpgrade = cleanText(summonUpgrade);
        mainHandler(summonUpgrade);
    })
})();


(function () { 
    const keyItemsSig = 'e8 ?? ?? ?? ?? ff c7 ?? 83 c7 08';
    var results = Memory.scanSync(__e.base, __e.size, keyItemsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[keyItemsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[keyItemsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: keyItems");

        const keyItemsAddress = this.context.rax;
        let keyItems = keyItemsAddress.readUtf8String();
        keyItems = cleanText(keyItems);
        secondaryHandler(keyItems);
    })
})();


(function () { 
    const strainPopUpSig = 'e8 ba 03 18 00';
    var results = Memory.scanSync(__e.base, __e.size, strainPopUpSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[strainPopUpPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[strainPopUpPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: strainPopUp");

        const strainPopUpAddress = this.context.rdx;
        let strainPopUp = strainPopUpAddress.readUtf8String();
        strainPopUp = cleanText(strainPopUp);
        mainHandler(strainPopUp);
    })
})();


(function () { 
    const strainDialogueSig = 'e8 b6 19 18 00';
    var results = Memory.scanSync(__e.base, __e.size, strainDialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[strainDialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[strainDialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: strainDialogue");

        const strainDialogueAddress = this.context.rdx;
        let strainDialogue = strainDialogueAddress.readUtf8String();
        strainDialogue = cleanText(strainDialogue);
        mainHandler(strainDialogue);
    })
})();


const invertedQuests = ["武勇伝その２", "武勇伝その３", "武勇伝その4"]; // These quests have the completion messages and details order mixed up for some reason
function readString(address, hookName) {
    let s = '', c;
    let nullCount = 0;

    switch (hookName) {
        case "choices":
            {
                while (true) { // We don't know how many times we want to loop as it depends on the amount of choices
                    while ((c = address.readU8()) !== 0x00) {
                        c = decoder.decode(address.readByteArray(4))[0];
                        s += c;
                        address = address.add(encoder.encode(c).byteLength);
                    }

                    nullCount++;

                    if (nullCount === 1)
                        s += "\n--------------------\n";
                    else
                        s += "\n";

                    if ((c = address.readU8()) === 0x00 && (c = address.add(1).readU8()) === 0x00) // Verify if there's another choice
                        break;

                    address = address.add(1);
                }
                return s;
            }

        case "irlMap":
            {
                while (nullCount < 2) { // Read the area name, then the description
                    while ((c = address.readU8()) !== 0x00) {
                        c = decoder.decode(address.readByteArray(4))[0];
                        s += c;
                        address = address.add(encoder.encode(c).byteLength);
                    }

                    nullCount++;

                    if (nullCount === 1)
                        s += "\n--------------------\n";

                    address = address.add(1);
                }
                return s;
            }

        case "overworldMap":
        case "tips":
            {
                // Read the bytes backwards
                address = address.sub(4);
                while ((c = address.readU8()) !== 0x00) {
                    c = decoder.decode(address.readByteArray(4))[0];
                    s += c;
                    address = address.sub(encoder.encode(c).byteLength);
                }
                return s.split('').reverse().join('');
            }

        case "quests":
            {
                while (nullCount < 3) { // Read the area name, then the description
                    while ((c = address.readU8()) !== 0x00) {
                        c = decoder.decode(address.readByteArray(4))[0];
                        // s += c;
                        if (nullCount === 0) // Read the name of the quest
                            s += c;

                        // // Skip the second part as it's the added message once the quest is cleared. Also means it won't be extracted once the quest is cleared... oh, well. Not that important anyway.

                        if (invertedQuests.includes(s) && nullCount === 1) { // Quests having the completion message before the quests' details
                            s += "\n--------------------\n";

                            while ((c = address.readU8()) !== 0x00) {
                                c = decoder.decode(address.readByteArray(4))[0];
                                s += c;
                                address = address.add(encoder.encode(c).byteLength);

                                if ((c = address.readU8()) === 0x00)
                                    return s;
                            }
                        }

                        else if (nullCount === 2) // Read the content of the quest
                            s += c;

                        address = address.add(encoder.encode(c).byteLength);
                    }

                    if (nullCount === 1)
                        s += "\n--------------------\n";

                    nullCount++;
                    address = address.add(1);
                }
                return s;
            }
    }
}


function cleanText(text) {
    return text
        .replace(/#Key\[[^\]]*\]/g, "　")
        .replace(/#Icon\[[^\]]*\]/g, "")
        .replace(/�/g, '')
        .replace(/Search/g, '')
        .replace(/#Key\[R2/g, '')
        .replace(/#n/g, "\n")
        .trim();
}



function hardcodeMenuInformation(text) {
    if (text.includes("コマンドスキルの編成を行えます"))
        return "コマンドスキル編成\n--------------------\n" + text;

    else if (text.includes("アクションスキルの編成を行えます"))
        return "アクションスキル編成\n--------------------\n" + text;

    else if (text.includes("フィールドで使用可能なスキルを使用できます"))
        return "スキル使用\n--------------------\n" + text;

    else if (text.includes("難易度、音声、カメラの設定など"))
        return "オプション\n--------------------\n" + text;

    else if (text.includes("セーブデータを読み込みその場所まで戻ります"))
        return "ロード\n--------------------\n" + text;

    else if (text.includes("ゲームを終了しタイトル画面に戻ります"))
        return "タイトルに戻る\n--------------------\n" + text;

    else if (text.includes("これまでのデータを記録し保存します"))
        return "セーブ\n--------------------\n" + text;

    else
        return text;
}
