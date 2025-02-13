// ==UserScript==
// @name         Death end re;Quest 2
// @version      
// @author       Tom (tomrock645)
// @description  GOG, Steam
// * developer   Idea Factory, compile Heart
// * publisher   Idea Factory International
//
// https://www.gog.com/en/game/death_end_request_2
// https://store.steampowered.com/app/1266220/Death_end_reQuest_2/
// ==/UserScript==


console.warn("Most text gets extracted but there's still some I couldn't find a hook for, so an OCR tool might be needed at times (I use YomiNinja)");
console.warn("Known issues:\n- If you load a save file that was saved mid-dialogue, some of the previous messages in that event will be extracted.");
console.warn("- If you skip an event the last message of that event will be extracted.")


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 300);
const tipsHandler = trans.send(s => s, -200);

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


// Actually I'm not sure anymore if the cooldown changes something, but might as well keep it just in case.
// let lastCallTime = 0;
// const DIALOGUE_COOLDOWN = 200; 
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
        // const currentTime = Date.now();
        // // console.warn(`[Debug] Time since last call: ${currentTime - lastCallTime}ms`);

        // // Saving and loading a save file mid-dialogue will have messages extracted up until the current one, so this prevents *some* of them.
        // if (currentTime - lastCallTime < DIALOGUE_COOLDOWN) {
        //     lastCallTime = currentTime;
        //     return;
        // }
        // lastCallTime = currentTime;

        const dialogueAddress = this.context.rsi;
        let currentText = dialogueAddress.readUtf8String();
        currentText = cleanText(currentText);

        if (!isNamed)
            mainHandler(currentText);

        else {
            mainHandler(currentName + "\n" + currentText);
            isNamed = false; // Set to false in case the next line of text doesn't call the name signature
        }
    })
})();


(function () {
    const overworldNameSig = 'e8 56 47 d9 ff';
    var results = Memory.scanSync(__e.base, __e.size, overworldNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[overworldNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[overworldNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: overworldName");

        const overworldNameAddress = this.context.rdx;
        let overworldName = overworldNameAddress.readUtf8String();

        mainHandler(overworldName + "\n" + overworldDialogue);
    })
})();


let overworldDialogue = "";
(function () {
    const overworldDialogueSig = 'e8 ?? ?? ?? ?? ?? 8b 4b 58 e8 ?? ?? ?? ?? 0f 2f';
    var results = Memory.scanSync(__e.base, __e.size, overworldDialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[overworldDialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[overworldDialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: overworldDialogue");

        const overworldDialogueAddress = this.context.rdx;
        overworldDialogue = overworldDialogueAddress.readUtf8String();

        // mainHandler(overworldName + "\n" + overworldDialogue);
    })
})();


(function () {
    const choicesSig = 'e8 11 44 c0 ff'
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

        const choicesAddress = this.context.rdi;
        let choices = choicesAddress.readUtf8String();

        choices = readString(choicesAddress, "choices");
        mainHandler(choices);
    })
})();


(function () {
    const menuIconDescriptionSig = 'e8 f1 81 dc ff';
    var results = Memory.scanSync(__e.base, __e.size, menuIconDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuIconDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuIconDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuIconDescription");

        const menuIconDescriptionAddress = this.context.rdx;
        let menuIconDescription = menuIconDescriptionAddress.readUtf8String();

        menuIconDescription = cleanText(menuIconDescription);

        mainHandler(menuIconDescription);
    })
})();


(function () {
    const menuInforimationSig = 'e8 ?? ?? ?? ?? eb ?? ?? 8d 88 80 00';
    var results = Memory.scanSync(__e.base, __e.size, menuInforimationSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuInforimationPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuInforimationPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuInforimation");

        const menuInforimationAddress = this.context.rax;
        let menuInforimation = menuInforimationAddress.readUtf8String();
        menuInforimation = cleanText(menuInforimation);

        menuInforimation = menuInfoAddText(menuInforimation);

        mainHandler(menuInforimation);
    })
})();


let tipsDetails = "";
(function () {
    const tipsSig = '80 3a 00 74 ?? ff c0 ?? 83 c1 10'; // 14019fbe3
    var results = Memory.scanSync(__e.base, __e.size, tipsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tipsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tipsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tips");

        const tipsAddress = this.context.rdx;
        tipsDetails = tipsAddress.readUtf8String();
        let tipsName = readString(tipsAddress, "tips");

        tipsName = cleanText(tipsName);
        tipsDetails = cleanText(tipsDetails);

        addTipsText(tipsName); // I couldn't find a hook for getting the text for quests having more than one page of explanation, so I'm hardcoding it

        tipsHandler(tipsName + "\n--------------------\n" + tipsDetails);
    })
})();


(function () {
    const skillsSig = 'e8 ?? ?? ?? ?? ?? 89 9c ?? ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, skillsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[skillsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[skillsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: skills");

        const skillsAddress = this.context.rdx;
        let skills = skillsAddress.readUtf8String();
        skills = cleanText(skills).trim();

        mainHandler(skills);
    })
})();


(function () {
    const itemsSig = 'e8 ?? ?? ?? ?? 0f 28 b4 ?? ?? ?? ?? ?? 0f 28 bc ?? ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8';
    var results = Memory.scanSync(__e.base, __e.size, itemsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: items");

        const itemsAddress = this.context.rdx;
        let items = itemsAddress.readUtf8String();
        items = cleanText(items);

        mainHandler(items);
    })
})();



(function () {
    const questsSig = 'e8 ?? ?? ?? ?? ?? 83 7e 30 00 75';
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

        const questsAddress = this.context.rax;
        let questDetails = questsAddress.readUtf8String();
        questDetails = cleanText(questDetails);

        let questName = readString(questsAddress, "quests");
        questName = cleanText(questName);

        mainHandler(questName + "\n--------------------\n" + questDetails);
    })
})();


(function () {
    const difficultySig = 'e8 d6 68 d8 ff';
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


(function () {
    const episodeChartRewardSig = 'e8 31 85 e1 ff';
    var results = Memory.scanSync(__e.base, __e.size, episodeChartRewardSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[episodeChartRewardPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[episodeChartRewardPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: episodeChartReward");

        const episodeChartRewardAddress = this.context.rdx;
        let episodeChartReward = episodeChartRewardAddress.readUtf8String();
        episodeChartReward = cleanText(episodeChartReward);

        mainHandler(episodeChartReward);
    })
})();


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
                // Read the bytes backwards
                address = address.sub(4);
                while ((c = address.readU8()) !== 0x00) {
                    c = decoder.decode(address.readByteArray(4))[0];
                    s += c;
                    address = address.sub(encoder.encode(c).byteLength);
                }
                return s.split('').reverse().join('');
            }
    }
}


function menuInfoAddText(text) {
    if (text.includes("フィールドで使用可能なスキルを使用できます。"))
        return "スキル使用\n--------------------\n" + text;

    else if (text.includes("コマンドスキルの編成を行えます。"))
        return "コマンドスキル編成\n--------------------\n" + text;

    else if (text.includes("アクションスキルの編成を行えます。"))
        return "アクションスキル編成\n--------------------\n" + text;

    else if (text.includes("難易度、音声、カメラの設定など"))
        return "オプション\n--------------------\n" + text;

    else if (text.includes("これまでのデータを記録し保存します。"))
        return "セーブ\n--------------------\n" + text;

    else if (text.includes("セーブデータを読み込みその場所まで戻ります。"))
        return "ロード\n--------------------\n" + text;

    else if (text.includes("ゲームを終了しタイトル画面に戻ります。"))
        return "タイトルに戻る\n--------------------\n" + text;

    else
        return text;
}


function addTipsText(text) {
    switch (text) {
        case "セーブポイントについて":
            tipsDetails += "\n\nまた、一定期間に「テレポートストーンを使用する」機能が追加されます。\n一部制限がありますが、一度訪れたことがあるセーヴポイントへ\nワープすることができます。";
            break;

        case "バグアクション　まい編":
            tipsDetails += "\n\n監視カメラには偽物の壁を見分けることのできる機能、\n見えない宝箱を発見する機能、隠されたヒントを見つける機能が備わっています。\n積極的に使っていきましょう！";
            break;

        case "追ってくる黒い影":
            tipsDetails += "\n\nやつに見つかったら、にげろ……\nにげろ、にげろ、にげろ、にげろ、にげろ、にげろ、にげろ\nにげろ、にげろ、にげろ、にげろ、にげろ、にげろ";
            break;

        case "トライアクトシステム":
            tipsDetails += "\n\n属性に関して月属性攻撃は日属性モンスターに対して有効です。\nまた目属性攻撃は星属性モンスターラ対して有効、\n星属性攻撃は月属性モンス夕ーに対て有効です。";
            break;

        case "呪いバグについて":
            tipsDetails += "\n\nノックバグ、ノックブロウで吹き飛ばした敵が、呪いバグを巻き込むと、\n発動したキャラクターはその呪いバグの効果を得ることができます。";
            break;

        case "グリッジスタイルについて":
            tipsDetails += "\n\n変身中はキャラクターは強化され、グリッジスタイルの時のみ、\n汚染度を全て使用した特殊技『ワイルドスキル』を使用することができます。\n強力なスキルなので多用していきましょう！"
                + "\n\n変身中、自分の夕一ン終了時に汚染度が10％減ります。\nグリッジスタイル中は汚染度80％未満になると、\nグリッジスタイルは解除されます。注意しながら戦いましょう！";
            break;
    }
}



function cleanText(text) {
    return text
        .replace(/�(3|10%|80%)�/g, "")
        .replace(/�/g, '')
        .replace(/sm\d+_\d+/g, "")
        .replace(/#Key\[[^\]]*\]/g, "　")
        .replace(/#Key\[Options/g, '')
        .replace(/#Color\[[^\]]*\]/g, "")
        .replace(/#Speed\[[^\]]*\]/g, "")
        .replace(/#Type\[[^\]]*\]/g, "")
        .replace(/#FontColorB/g, "")
        .replace(/#FontColor/g, "")
        .replace(/#FCB/g, "")
        .replace(/#UI\[\d+\]/g, "")
        .replace(/#FC/g, "")
        .replace(/\b\d{1,2}#FC\b/g, "")
        .replace(/#n/g, "\n")
        .trim();
}
