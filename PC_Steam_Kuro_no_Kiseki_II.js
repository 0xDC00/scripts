// ==UserScript==
// @name         Kuro no Kiseki II
// @version      1.2.10
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   NIS Ameria
//
// https://store.steampowered.com/app/2668430/The_Legend_of_Heroes_Trails_through_Daybreak_II/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_through_daybreak_ii_standard_edition
// ==/UserScript==


console.warn("- Known issues:\n- If you want to read the books/newspapers you have to first flip the pages to have the first page's text extracted.");
console.warn("- When obtaining a new side quest it's possible for the text to get extracted alongside the dialogue text, if there's one.");
console.warn("- When in the orbment menu the hollow core description will get extracted even if it's not on screen yet.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '50+');


(function () {
    const nameSig = 'e8 ?? ?? ?? ?? ?? 8b 8b e0 00 00 00 ?? 81';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[namePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[namePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rdx;
        let name = nameAddress.readUtf8String();
        mainHandler(name);
    });
})();


(function () {
    const dialogueSig = 'ff 15 ?? ?? ?? ?? ?? 01 b7 00 08 00 00 eb';
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

        const textAddress = this.context.rdx;
        let text = textAddress.readUtf8String();
        text = cleanText(text);

        // Dialogue gets called before name
        setTimeout(() => {
            mainHandler(text);
        }, 50);
        
        // console.warn(hexdump(dialogueAddress, { header: false, ansi: false, length: 0x100 }));
    });
})();


(function () {
    const activeVoiceSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 78 0c 01 75 ?? 8b 83 10 03 00';
    var results = Memory.scanSync(__e.base, __e.size, activeVoiceSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[activeVoicePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[activeVoicePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: activeVoice");

        const activeVoiceAddress = this.context.rdx;
        let activeVoice = activeVoiceAddress.readUtf8String();
        activeVoice = cleanText(activeVoice);

        mainHandler(activeVoice);
    });
})();


(function () { 
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? ?? 8b 8e 98 00 00 00 ba 1d 80';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage1");

        const systemMessageAddress = this.context.rdx;
        let systemMessage = systemMessageAddress.readUtf8String();
        systemMessage = cleanText(systemMessage);

        mainHandler(systemMessage);
    });
})();


(function () { 
    const systemMessage2Sig = 'e8 ?? ?? ?? ?? ?? 8b 8e 98 00 00 00 ba 1d 80 00 00 ?? 8b 01 ff 50 50 ?? 8b 8e 98 00 00 00 33 d2 e8 ?? ?? ?? ?? ?? 8b 85 c8';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage2");

        const systemMessageAddress = this.context.rdx;
        let systemMessage = systemMessageAddress.readUtf8String();
        systemMessage = cleanText(systemMessage);

        mainHandler(systemMessage);
    });
})();


(function () { 
    const optionDescriptionSig = 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 20 e8 ?? ?? ?? ?? 83';
    var results = Memory.scanSync(__e.base, __e.size, optionDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[optionDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[optionDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: optionDescription");

        const optionDescriptionAddress = this.context.rdx;
        let optionDescription = optionDescriptionAddress.readUtf8String();
        secondHandler(optionDescription);
    });
})();


(function () { 
    const tipsSig = 'e8 ?? ?? ?? ?? ?? 8b 53 28 ?? 8b 4d';
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
        let tipName = tipsAddress.readUtf8String();
        let tipDescription = readString(tipsAddress, "tips");
        tipDescription = cleanText(tipDescription);

        mainHandler(tipName + "\n\n" + tipDescription);
    });
})();


(function () {
    const choices1Sig = 'e8 ?? ?? ?? ?? ?? 8b d8 ?? 8b d3 ?? 8b ce ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, choices1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[choices1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[choices1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices1");

        const choicesAddress = this.context.rdx;
        let choices = choicesAddress.readUtf8String();
        choices = cleanText(choices);

        mainHandler(choices);
    });
})();


(function () {
    const choices2Sig = 'e8 ?? ?? ?? ?? 8b 83 10 03 00 00 8b c8 83 e1 02';
    var results = Memory.scanSync(__e.base, __e.size, choices2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[choices2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[choices2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices2");

        const choicesAddress = this.context.rdx;
        let choices = choicesAddress.readUtf8String();
        choices = cleanText(choices);

        // choices2 gets called before the thoughts
        setTimeout(() => {
            mainHandler(choices);
        }, 50);
    });
})();


(function () {
    const choices3Sig = 'e8 ?? ?? ?? ?? ?? 8b 47 28 ?? 8b 90 40 02 00 00 ?? 8b 80 48 02 00 00 ?? 8d 1c c2 ?? 3b d3 74 ?? 0f 1f 40 00 66 66';
    var results = Memory.scanSync(__e.base, __e.size, choices3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[choices3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[choices3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices3");

        const choicesAddress = this.context.rdx;
        let choices = choicesAddress.readUtf8String();
        choices = cleanText(choices);

        mainHandler(choices);
    });
})();


(function () {
    const choiceThoughtsSig = 'e8 ?? ?? ?? ?? ?? 8b 8f a0 00 00 00 e8';
    var results = Memory.scanSync(__e.base, __e.size, choiceThoughtsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[choiceThoughtsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[choiceThoughtsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: choiceThoughts");

        const choiceThoughtsAddress = this.context.rdx;
        let choiceThoughts = choiceThoughtsAddress.readUtf8String();
        choiceThoughts = cleanText(choiceThoughts);

        mainHandler(choiceThoughts + "\n");
    });
})();


(function () { // From the upgrade screen
    const craftDescriptionSig = 'e8 ?? ?? ?? ?? 90 ?? 8b 54 ?? ?? ?? 8b cb e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74';
    var results = Memory.scanSync(__e.base, __e.size, craftDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[craftDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[craftDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: craftDescription");

        const craftDescriptionAddress = this.context.rdx;
        let craftDescription = craftDescriptionAddress.readUtf8String();
        let craftName = readString(craftDescriptionAddress, "craft");
        craftDescription = cleanText(craftDescription);

        secondHandler(craftName + "\n" + craftDescription);
    });
})();


let previousItemDescription = '';
(function () {
    const itemDescriptionSig = 'ff 15 ?? ?? ?? ?? 8b 83 80 01 00 00 c6 04 18 00 ?? 8b c3 ?? 8b 9c';
    var results = Memory.scanSync(__e.base, __e.size, itemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemDescription");

        const itemDescriptionAddress = this.context.rdx;
        let itemDescription = itemDescriptionAddress.readUtf8String();
        let itemName = readString(itemDescriptionAddress);
        itemDescription = cleanText(itemDescription);

        if (itemName === "" || itemDescription === "" || itemDescription === previousItemDescription)
            return;

        previousItemDescription = itemDescription;

        secondHandler(itemName + "\n" + itemDescription);
    });
})();


(function () {
    const hollowCoreDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 05 ?? ?? ?? ?? ?? 89 ?? ?? ?? ?? 89 ?? ?? ?? ?? 8d 05 ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, hollowCoreDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[hollowCoreDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[hollowCoreDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: hollowCoreDescription");

        const hollowCoreDescriptionAddress = this.context.rdx;
        let hollowCoreDescription = hollowCoreDescriptionAddress.readUtf8String();
        // hollowCoreDescription = cleanText(hollowCoreDescription);

        previousItemDescription = '';

        secondHandler(hollowCoreDescription);
    });
})();


let itemGetName = '';
(function () { 
    const itemGetNameSig = 'ff 15 ?? ?? ?? ?? 85 c0 b9 ff ff ff ff 0f 48 c1 89 83 00 02';
    var results = Memory.scanSync(__e.base, __e.size, itemGetNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemGetNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemGetNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemGetName");

        try {
        const itemGetNameAddress = this.context.rsi.add(16).readPointer();
        itemGetName = itemGetNameAddress.readUtf8String();
        itemGetName = cleanText(itemGetName);
        }
        catch(e) {}
    });
})();


(function () { 
    const itemGetDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 c8 01';
    var results = Memory.scanSync(__e.base, __e.size, itemGetDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemGetDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemGetDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemGetDescription");

        const itemGetDescriptionAddress = this.context.rdx;
        let itemGetDescription = itemGetDescriptionAddress.readUtf8String();
        itemGetDescription = cleanText(itemGetDescription);

        mainHandler(itemGetName + "\n" + itemGetDescription);
    });
})();


(function () { 
    const craftGetSig = 'e8 ?? ?? ?? ?? ?? 8b 8b 98 00 00 00 ba 1d 80 00 00 ?? 8b 01 ff 50 50 ?? 8b 8b 98 00 00 00 33 d2 e8 ?? ?? ?? ?? f3';
    var results = Memory.scanSync(__e.base, __e.size, craftGetSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[craftGetPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[craftGetPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: craftGet");

        const craftGetAddress = this.context.rdx;
        let craftGet = craftGetAddress.readUtf8String();
        craftGet = cleanText(craftGet);

        mainHandler(craftGet);
    });
})();


(function () { 
    const clearRewardItemDescriptionSig = 'e8 ?? ?? ?? ?? 83 bf c8 00 00 00 00 75 ?? ?? 8b 9f b0 00 00 00';
    var results = Memory.scanSync(__e.base, __e.size, clearRewardItemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[clearRewardItemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[clearRewardItemDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: clearRewardItemDescription");

        const clearRewardItemDescriptionAddress = this.context.rdx;
        let itemName = readString(clearRewardItemDescriptionAddress);
        let clearRewardItemDescription = clearRewardItemDescriptionAddress.readUtf8String();
        clearRewardItemDescription = cleanText(clearRewardItemDescription);

        thirdHandler(itemName + "\n" + clearRewardItemDescription);
    });
})();


(function () {
    const booksSig = 'e8 ?? ?? ?? ?? 8b 93 d8 01 00 00 ?? 8b 8b 90 01';
    var results = Memory.scanSync(__e.base, __e.size, booksSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[booksPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[booksPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: books");

        const booksAddress = this.context.rdx;
        let books = booksAddress.readUtf8String();
        books = cleanText(books);

        secondHandler(books);
    });
})();


(function () {
    const chartMapCaseFileDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 46 10 ?? 8b 90 40 02 00 00 ?? 8b 80 48 02 00 00 ?? 8d 1c c2 ?? 3b d3 74 ?? 0f 1f 40 00 0f 1f 84 00 00 00 00 00 ?? b1 01 ?? b8 fe ff ff 7f ?? 8d 15 ?? ?? ?? ?? ?? 8b 0a e8 ?? ?? ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, chartMapCaseFileDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[chartMapCaseFileDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[chartMapCaseFileDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: chartMapCaseFileDescription");

        const chartMapCaseFileDescriptionAddress = this.context.rdx;
        let chartMapCaseFileDescription = chartMapCaseFileDescriptionAddress.readUtf8String();
        chartMapCaseFileDescription = cleanText(chartMapCaseFileDescription);

        thirdHandler(chartMapCaseFileDescription + "\n");
    });
})();


(function () {
    const chartMapCaseFileNextSig = '75 ?? ?? 8b c7 ?? 8b 45 00';
    var results = Memory.scanSync(__e.base, __e.size, chartMapCaseFileNextSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[chartMapCaseFileNextPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x0d);
    console.log('[chartMapCaseFileNextPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: chartMapCaseFileNext");

        const chartMapCaseFileNextAddress = this.context.rcx;
        let chartMapCaseFileNext = chartMapCaseFileNextAddress.readUtf8String();
        // chartMapCaseFileNext = cleanText(chartMapCaseFileNext);

        thirdHandler(chartMapCaseFileNext);
    });
})();


(function () { // Act & dead
    const chartMapCaseFileChoicesSig = '80 39 00 0f 84 ?? ?? ?? ?? ?? 8b 7e 18';
    var results = Memory.scanSync(__e.base, __e.size, chartMapCaseFileChoicesSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[chartMapCaseFileChoicesPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[chartMapCaseFileChoicesPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: chartMapCaseFileChoices");

        const chartMapCaseFileChoicesAddress = this.context.rcx;
        let chartMapCaseFileChoices = chartMapCaseFileChoicesAddress.readUtf8String();
        // chartMapCaseFileChoices = cleanText(chartMapCaseFileChoices);

        thirdHandler(chartMapCaseFileChoices);
    });
})();


let previousNoteTitle = '';
let mainNoteText = '';
(function () { 
    const mainNoteTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 56 10 ?? 8b cf e8';
    var results = Memory.scanSync(__e.base, __e.size, mainNoteTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[mainNoteTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[mainNoteTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: mainNoteTitle");

        const mainNoteTitleAddress = this.context.rdx;
        let mainNoteTitle = mainNoteTitleAddress.readUtf8String();
        // mainNoteTitle = cleanText(mainNoteTitle);
        if (mainNoteTitle === previousNoteTitle) 
            return;

        previousNoteTitle = mainNoteTitle;

        // Wait a little bit to get all the info needed related to the main notes
        setTimeout(() => {
            secondHandler(mainNoteTitle + mainNoteText);
        }, 50);
    });
})();


(function () { 
    const mainNoteRequestDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? 0f b7 96';
    var results = Memory.scanSync(__e.base, __e.size, mainNoteRequestDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[mainNoteRequestDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[mainNoteRequestDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: mainNoteRequestDescription");

        const mainNoteRequestDescriptionAddress = this.context.rdx;
        let mainNoteRequestDescription = mainNoteRequestDescriptionAddress.readUtf8String();
        mainNoteText = "\n---------------------\n" + mainNoteRequestDescription + "\n---------------------";
    });
})();


(function () { 
    const mainNoteSurveyRecordSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 78 0c 05 0f 85 ?? ?? ?? ?? ?? 8b 4c ?? 38';
    var results = Memory.scanSync(__e.base, __e.size, mainNoteSurveyRecordSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[mainNoteSurveyRecordPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[mainNoteSurveyRecordPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: mainNoteSurveyRecord");

        const mainNoteSurveyRecordAddress = this.context.rdx;
        let mainNoteSurveyRecord = mainNoteSurveyRecordAddress.readUtf8String();
        mainNoteText += "\n" + mainNoteSurveyRecord + "\n";
    });
})();


let questNoteText = '';
(function () { 
    const questNoteTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 53 10 ?? 8b ce e8 ?? ?? ?? ?? ?? be';
    var results = Memory.scanSync(__e.base, __e.size, questNoteTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNoteTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questNoteTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNoteTitle");

        const questNoteTitleAddress = this.context.rdx;
        let questNoteTitle = questNoteTitleAddress.readUtf8String();
        // questNoteTitle = cleanText(questNoteTitle);
        if (questNoteTitle === previousNoteTitle) 
            return;

        previousNoteTitle = questNoteTitle;

        // Wait a little bit to get all the info needed related to the quest notes
        setTimeout(() => {
            secondHandler(questNoteTitle + questNoteText);
        }, 50);
    });
})();


(function () { 
    const questNoteRequestDescriptionSig = 'e8 ?? ?? ?? ?? 0f b7 16 66 3b';
    var results = Memory.scanSync(__e.base, __e.size, questNoteRequestDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNoteRequestDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questNoteRequestDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNoteRequestDescription");

        const questNoteRequestDescriptionAddress = this.context.rdx;
        let questNoteRequestDescription = questNoteRequestDescriptionAddress.readUtf8String();
        questNoteText = "\n---------------------\n" + questNoteRequestDescription + "\n---------------------";
    });
})();


(function () { 
    const questNoteSurveyRecordSig = '75 ?? ?? 8b c7 ?? 89 44 ?? 38 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, questNoteSurveyRecordSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNoteSurveyRecordPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x11);
    console.log('[questNoteSurveyRecordPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNoteSurveyRecord");

        const questNoteSurveyRecordAddress = this.context.rdx;
        let questNoteSurveyRecord = questNoteSurveyRecordAddress.readUtf8String();
        questNoteText += "\n" + questNoteSurveyRecord + "\n";
    });
})();


let toDoListText = '';
(function () { 
    const toDoListTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 46 38 ?? 8d 15 ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, toDoListTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[toDoListTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[toDoListTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: toDoListTitle");

        const toDoListTitleAddress = this.context.rdx;
        let toDoListTitle = toDoListTitleAddress.readUtf8String();
        // toDoListTitle = cleanText(toDoListTitle);
        if (toDoListTitle === previousNoteTitle) 
            return;

        previousNoteTitle = toDoListTitle;

        // Wait a little bit to get all the info needed related to the to do list content
        setTimeout(() => {
            secondHandler(toDoListTitle + toDoListText);
            toDoListText = '';
        }, 200);
    });
})();


(function () { 
    const toDoListRequestDescriptionSig = 'e8 ?? ?? ?? ?? c7 83 1c 02 00 00 00 00 80 3f c7 83 14 02 00 00 00 00 80 3f c7 83 18 02 00 00 00 00 80 3f ?? c7 83 20 02 00 00 00 00 00 00 ?? 89 bb 28 02 00 00';
    var results = Memory.scanSync(__e.base, __e.size, toDoListRequestDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[toDoListRequestDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[toDoListRequestDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: toDoListRequestDescription");

        const toDoListRequestDescriptionAddress = this.context.rdx;
        let toDoListRequestDescription = toDoListRequestDescriptionAddress.readUtf8String();
        toDoListText = "\n---------------------\n" + toDoListRequestDescription + "\n---------------------" + toDoListText;
    });
})();


(function () { 
    const toDoListSurveyRecordSig = 'e8 ?? ?? ?? ?? f3 ?? 0f 10 46 10 f3';
    var results = Memory.scanSync(__e.base, __e.size, toDoListSurveyRecordSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[toDoListSurveyRecordPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[toDoListSurveyRecordPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: toDoListSurveyRecord");

        const toDoListSurveyRecordAddress = this.context.rdx;
        let toDoListSurveyRecord = toDoListSurveyRecordAddress.readUtf8String();
        toDoListText += "\n" + toDoListSurveyRecord + "\n";
    });
})();


(function () { // From the board when getting a new quest
    const questNameSig = 'e8 ?? ?? ?? ?? ?? 8b 85 c0 00 00 00 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, questNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questName");

        const questNameAddress = this.context.rdx;
        let questName = questNameAddress.readUtf8String();

        setTimeout(() => {
            mainHandler(questName + "\n");
        }, 150);
    });
})();


(function () {  // From the board when getting a new quest
    const questDescriptionSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 78 0c 01 75 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, questDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questDescription");

        const questDescriptionAddress = this.context.rdx;
        let questDescription = questDescriptionAddress.readUtf8String();

        setTimeout(() => {
            mainHandler(questDescription);
        }, 150);
    });
})();


(function () { 
    const connectNoteTopicNameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 10 ?? 85 d2 74';
    var results = Memory.scanSync(__e.base, __e.size, connectNoteTopicNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[connectNoteTopicNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[connectNoteTopicNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: connectNoteTopicName");

        const connectNoteTopicNameAddress = this.context.rdx;
        let connectNoteTopicName = connectNoteTopicNameAddress.readUtf8String();
        thirdHandler(connectNoteTopicName);
    });
})();


(function () { 
    const connectNoteTopicDescriptionSig = 'e8 ?? ?? ?? ?? ff c5 ?? 83 c7 08 ff c6';
    var results = Memory.scanSync(__e.base, __e.size, connectNoteTopicDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[connectNoteTopicDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[connectNoteTopicDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: connectNoteTopicDescription");

        const connectNoteTopicDescriptionAddress = this.context.rdx;
        let connectNoteTopicDescription = connectNoteTopicDescriptionAddress.readUtf8String();
        thirdHandler(connectNoteTopicDescription + "\n");
    });
})();


(function () { 
    const fishNoteNameSig = 'e8 ?? ?? ?? ?? ?? 39 be 80 01';
    var results = Memory.scanSync(__e.base, __e.size, fishNoteNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[fishNoteNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[fishNoteNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: fishNoteName");

        const fishNoteNameAddress = this.context.rdx;
        let fishNoteName = fishNoteNameAddress.readUtf8String();
        thirdHandler(fishNoteName);
    });
})();


(function () { 
    const fishNoteDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b e7 ?? 89 7c ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, fishNoteDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[fishNoteDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[fishNoteDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: fishNoteDescription");

        const fishNoteDescriptionAddress = this.context.rdx;
        let fishNoteDescription = fishNoteDescriptionAddress.readUtf8String();
        thirdHandler(fishNoteDescription);
    });
})();


let prestoryName = '';
(function () { 
    const prestory1NameSig = 'e8 ?? ?? ?? ?? ?? 8b 56 18 ?? 8b cb e8 ?? ?? ?? ?? 8b 87 1c 02 00 00 89 87 14 02 00 00 c7 87 18 02 00 00 00 00 80 3f ?? c7 87 20 02 00 00 cd cc 4c 3e ?? 33 f6';
    var results = Memory.scanSync(__e.base, __e.size, prestory1NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory1NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory1NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory1Name");

        const prestoryAddress = this.context.rdx;
        prestoryName = prestoryAddress.readUtf8String();
        prestoryName = cleanText(prestoryName);
    });
})();


(function () {
    const prestory1Sig = 'e8 ?? ?? ?? ?? 8b 87 1c 02 00 00 89 87 14 02 00 00 c7 87 18 02 00 00 00 00 80 3f ?? c7 87 20 02 00 00 cd cc 4c 3e ?? 33 f6 ?? 89';
    var results = Memory.scanSync(__e.base, __e.size, prestory1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory1");

        const prestoryAddress = this.context.rdx;
        let prestory = prestoryAddress.readUtf8String();
        prestory = cleanText(prestory);

        secondHandler(prestoryName + "\n\n" + prestory);
    });
})();


(function () { 
    const prestory2NameSig = 'e8 ?? ?? ?? ?? ?? 8b 57 18 ?? 8b cb e8 ?? ?? ?? ?? 8b 87 1c 02 00 00 89 87 14 02 00 00 c7 87 18 02 00 00 00 00 80 3f';
    var results = Memory.scanSync(__e.base, __e.size, prestory2NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory2NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory2NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory2Name");

        const prestoryAddress = this.context.rdx;
        prestoryName = prestoryAddress.readUtf8String();
        prestoryName = cleanText(prestoryName);
    });
})();


(function () { 
    const prestory2Sig = 'e8 ?? ?? ?? ?? 8b 87 1c 02 00 00 89 87 14 02 00 00 c7 87 18 02 00 00 00 00 80 3f ?? c7 87 20 02 00 00 cd cc 4c 3e 89 b7 28 02 00 00 8b 83 1c 02 00 00 89 83 14 02 00 00 c7 83 18 02 00 00 00 00 80 3f';
    var results = Memory.scanSync(__e.base, __e.size, prestory2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory2");

        const prestoryAddress = this.context.rdx;
        let prestory = prestoryAddress.readUtf8String();
        prestory = cleanText(prestory);

        secondHandler(prestoryName + "\n\n" + prestory);
    });
})();


(function () { 
    const prestory3NameSig = 'e8 ?? ?? ?? ?? ?? 8b 56 18 ?? 8b cb e8 ?? ?? ?? ?? 8b 87 1c 02 00 00 89 87 14 02 00 00 c7 87 18 02 00 00 00 00 80 3f ?? c7 87 20 02 00 00 cd cc 4c 3e';
    var results = Memory.scanSync(__e.base, __e.size, prestory3NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory3NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory3NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory3Name");

        const prestoryAddress = this.context.rdx;
        prestoryName = prestoryAddress.readUtf8String();
        prestoryName = cleanText(prestoryName);
    });
})();


(function () { 
    const prestory3Sig = 'e8 ?? ?? ?? ?? 8b 87 1c 02 00 00 89 87 14 02 00 00 c7 87 18 02 00 00 00 00 80 3f ?? c7 87 20 02 00 00 cd cc 4c 3e ?? 89';
    var results = Memory.scanSync(__e.base, __e.size, prestory3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory3");

        const prestoryAddress = this.context.rdx;
        let prestory = prestoryAddress.readUtf8String();
        prestory = cleanText(prestory);

        secondHandler(prestoryName + "\n\n" + prestory);
    });
})();


(function () { 
    const prestory4NameSig = 'e8 ?? ?? ?? ?? ?? 8b 55 18 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, prestory4NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory4NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory4NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory4Name");

        const prestoryAddress = this.context.rdx;
        prestoryName = prestoryAddress.readUtf8String();
        prestoryName = cleanText(prestoryName);
    });
})();


(function () { 
    const prestory4Sig = 'e8 ?? ?? ?? ?? ?? 0f b7 c6 ?? 0f';
    var results = Memory.scanSync(__e.base, __e.size, prestory4Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory4Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory4Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory4");

        const prestoryAddress = this.context.rdx;
        let prestory = prestoryAddress.readUtf8String();
        prestory = cleanText(prestory);

        secondHandler(prestoryName + "\n\n" + prestory);
    });
})();


(function () { 
    const prestory5NameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 08 ?? 8b cf e8';
    var results = Memory.scanSync(__e.base, __e.size, prestory5NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory5NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory5NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory5Name");

        const prestoryAddress = this.context.rdx;
        prestoryName = prestoryAddress.readUtf8String();
        prestoryName = cleanText(prestoryName);
    });
})();


(function () { 
    const prestory5Sig = 'e8 ?? ?? ?? ?? ?? 0f b7 c6';
    var results = Memory.scanSync(__e.base, __e.size, prestory5Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestory5Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestory5Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory5");

        const prestoryAddress = this.context.rdx;
        let prestory = prestoryAddress.readUtf8String();
        prestory = cleanText(prestory);

        secondHandler(prestoryName + "\n\n" + prestory);
    });
})();


(function () { 
    const connectEventNameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 18 ?? 8b cf';
    var results = Memory.scanSync(__e.base, __e.size, connectEventNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[connectEventNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[connectEventNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: connectEventName");

        const connectEventNameAddress = this.context.rdx;
        let connectEventName = connectEventNameAddress.readUtf8String();
        thirdHandler(connectEventName);
    });
})();


(function () { 
    const connectEventDescriptionSig = 'e8 ?? ?? ?? ?? 0f b7 3b e9';
    var results = Memory.scanSync(__e.base, __e.size, connectEventDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[connectEventDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[connectEventDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: connectEventDescription");

        const connectEventDescriptionAddress = this.context.rdx;
        let connectEventDescription = connectEventDescriptionAddress.readUtf8String();
        thirdHandler(connectEventDescription);
    });
})();


(function () { 
    const connectEventConfirmationPromptSig = 'e8 ?? ?? ?? ?? ?? 8b 1d ?? ?? ?? ?? ?? 8b 44';
    var results = Memory.scanSync(__e.base, __e.size, connectEventConfirmationPromptSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[connectEventConfirmationPromptPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[connectEventConfirmationPromptPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: connectEventConfirmationPrompt");

        const connectEventConfirmationPromptAddress = this.context.rdx;
        let connectEventConfirmationPrompt = connectEventConfirmationPromptAddress.readUtf8String();
        connectEventConfirmationPrompt = cleanText(connectEventConfirmationPrompt);

        mainHandler(connectEventConfirmationPrompt);
    });
})();


const decoder = new TextDecoder('utf-8');
function readString(address, hookName) {
    let bytes = [];

    if (hookName === "craft") {
        // Read bytes backwards to get the name of the craft after the first occurrence of null bytes
        let nullCount = 0;
        address = address.sub(2);

        while (nullCount < 2) {
            let byte = address.readU8();

            if (nullCount === 1 && byte !== 0x00) 
                bytes.push(byte);
            
            if (byte === 0x00) 
                nullCount++;
            
            address = address.sub(1);
        }

        bytes.reverse(); 
    }

    else if (hookName === "tips") { 
        // Skip tip name, read description
        let nullCount = 0;

        while (nullCount < 2) { 
            while (address.readU8()) {
                if(nullCount === 0) {
                    address = address.add(1);
                    continue;
                }

                let byte = address.readU8();
                bytes.push(byte);
                address = address.add(1);
            }

            nullCount++;

            address = address.add(1);
        }
    }
    
    else  { 
        // Read bytes backwards to get the item name
        address = address.sub(2);

        while (address.readU8()) {
            let byte = address.readU8();

            if (byte === 0x00) 
                break;

            bytes.push(byte);       

            address = address.sub(1);
        }

        bytes.reverse();
    }

    return decoder.decode(Uint8Array.from(bytes));
}


function cleanText(text) {
    return text
        .replace(/<[^<>]*>/g, '')
        .replace(/<^>+/g, '')
        .replace(/\b[a-zA-Z]+\d+_\d+\b/g, '')
        .replace(/%[a-zA-Z0-9]+/g, ' ')
        .trim();
}