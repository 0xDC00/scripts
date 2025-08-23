// ==UserScript==
// @name         Sora no Kiseki the 1st / 空の軌跡 the 1st
// @version      Demo (and full release?)
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   GungHo
//
// https://store.steampowered.com/app/3375780/Trails_in_the_Sky_1st_Chapter/
// ==/UserScript==


console.warn("Known issues:\n- The description extraction for some items is a bit scuffed (e.g. second half before first half, one extra word before the second half, missing first half (would be too tedious to get the text and it's not worth it imo)).");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '25+');


(function () {
    const nameSig = 'e8 ?? ?? ?? ?? 8b 84 ?? ?? ?? ?? ?? ?? 85';
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
    const dialogueSig = 'e8 ?? ?? ?? ?? ?? 01 be';
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
        
        // console.warn(hexdump(textAddress, { header: false, ansi: false, length: 0x50 }));
    });
})();


(function () {
    const choicesSig = 'e8 ?? ?? ?? ?? ?? 8b 57 30 8b';
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
        mainHandler(choices);
    });
})();


(function () {
    const activeVoiceSig = 'e8 ?? ?? ?? ?? ?? 8b 83 a0 00 00 00 33';
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
    const tutorial1Sig = 'e8 ?? ?? ?? ?? 8b 46 40 ?? 88 3c 30 ?? 8b af 90';
    var results = Memory.scanSync(__e.base, __e.size, tutorial1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial1");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();
        tutorial = getDescription(tutorialAddress);
        tutorial = cleanText(tutorial);

        setTimeout(() => {
            thirdHandler("\n" + tutorial);
        }, 20);
    });
})();


(function () {
    const tutorial2Sig = 'e8 ?? ?? ?? ?? 8b 87 40 03 00 00 0f ba e0 09 72 ?? 66 c7 87 e0 06 00 00 01 01 0f ba e8 09 89 87 40 03 00 00 ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, tutorial2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial2");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();
        tutorial = cleanText(tutorial);

        if(tutorial !== '')
            thirdHandler("\n" + tutorial);
    });
})();


(function () {
    const tutorial3Sig = 'e8 ?? ?? ?? ?? 8b 83 40 03 00 00 0f ba e0 09 72 ?? 66 c7 83 e0 06 00 00 01 01 0f ba e8 09 89 83 40 03 00 00 0f 10 83 0c 01 00 00 0f 11 44 ?? ?? f3 ?? 0f 10 54 ?? 10';
    var results = Memory.scanSync(__e.base, __e.size, tutorial3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial3");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();
        tutorial = cleanText(tutorial);

        thirdHandler(tutorial);
    });
})();


(function () {
    const tutorial4Sig = 'e8 ?? ?? ?? ?? 8b 83 40 03 00 00 0f ba e0 09 72 ?? 66 c7 83 e0 06 00 00 01 01 0f ba e8 09 89 83 40 03 00 00 0f 10 83 0c 01 00 00 0f 11 44 ?? ?? f3 ?? 0f 10 54 ?? 20';
    var results = Memory.scanSync(__e.base, __e.size, tutorial4Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial4Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial4Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial4");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();
        tutorial = cleanText(tutorial);

        thirdHandler(tutorial);
    });
})();


(function () {
    const tutorial5Sig = 'e8 ?? ?? ?? ?? 8b 97 40 03';
    var results = Memory.scanSync(__e.base, __e.size, tutorial5Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial5Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial5Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial5");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();
        tutorial = cleanText(tutorial);

        setTimeout(() => {
            thirdHandler("\n" + tutorial);
        }, 20);
    });
})();


(function () { 
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? ?? 8b 8e 98 00 00 00 ba 1d 80 00 00 ?? 8b 01 ff 50 60 ?? 8b 8e 98 00 00 00 33 d2 e8 ?? ?? ?? ?? ?? 8b 85 d0 00 00 00 ?? 85 c0 75 ?? 0f 57 c9 0f 57 c0 eb ?? f3 0f 10 80 34 03 00 00 f3 0f 10 88 10 01 00 00 ?? 8b 0d';
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
    const systemMessage2Sig = 'e8 ?? ?? ?? ?? ?? 8b 8e 98 00 00 00 ba 1d 80 00 00 ?? 8b 01 ff 50 60 ?? 8b 8e 98 00 00 00 33 d2 e8 ?? ?? ?? ?? ?? 8b 85 d0 00 00 00 ?? 85 c0 75 ?? 0f 57 c9 0f 57 c0 eb ?? f3 0f 10 80 34 03 00 00 f3 0f 10 88 10 01 00 00 ?? 8b 05';
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
    const menuDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 4c ?? ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription1");

        const menuDescriptionAddress = this.context.rdx;
        let menuDescription = menuDescriptionAddress.readUtf8String();
        secondHandler(menuDescription);
    });
})();


(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription2");

        const menuDescriptionAddress = this.context.rdx;
        let menuDescription = menuDescriptionAddress.readUtf8String();
        secondHandler(menuDescription);
    });
})();


(function () {
    const orbmentSlotDescriptionSig = 'e8 ?? ?? ?? ?? 90 ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d ?? ?? 10';
    var results = Memory.scanSync(__e.base, __e.size, orbmentSlotDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[orbmentSlotDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[orbmentSlotDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: orbmentSlotDescription");

        const orbmentSlotDescriptionAddress = this.context.r11;
        let orbmentSlotDescription = orbmentSlotDescriptionAddress.readUtf8String();
        orbmentSlotDescription = cleanText(orbmentSlotDescription);
        
        secondHandler(orbmentSlotDescription);
    });
})();


let isAbnormalQuartz = false;
(function () {
    const inventorySig = 'e8 ?? ?? ?? ?? 90 ?? 83 ff 04 0f 85';
    var results = Memory.scanSync(__e.base, __e.size, inventorySig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[inventoryPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[inventoryPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventory");

        const inventoryAddress = this.context.rdx;
        let inventoryDescription = inventoryAddress.readUtf8String();
        let inventoryName = getName(inventoryAddress);
        inventoryDescription = cleanText(inventoryDescription);

        setTimeout(() => {
            if (inventoryDescription !== '' && itemDescription === '') {
                thirdHandler(inventoryName + "\n" + inventoryDescription);
                
                if(isQuartz) {
                    isAbnormalQuartz = true; // In case a quartz gets extracted from here with a description instead of only being the name
                    isQuartz = false;
                }
            }

            else if (itemDescription !== '') {
                thirdHandler(inventoryName + "\n" + itemDescription);
                itemDescription = '';
            }
            
            else 
                thirdHandler(inventoryName);
        }, 20);
    });
})();


let isQuartz = false;
let hasFirstQuartzHalf = false;
(function () { // First half
    const quartzDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b cf ?? 8b d0 ?? b8 04 08 00 00 e8 ?? ?? ?? ?? c6 ?? ?? ?? ?? ?? 00 ?? 8b 05';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription1");

        const quartzDescriptionAddress = this.context.r8;
        let quartzDescription1 = quartzDescriptionAddress.readUtf8String();
        quartzDescription1 = cleanText(quartzDescription1);

        isQuartz = true;
        hasFirstQuartzHalf = true;

        setTimeout(() => {
            if(isAbnormalQuartz) {
                thirdHandler(quartzDescription1);
                isAbnormalQuartz = false;
            }

            else if (quartzDescription3 === '') {
                thirdHandler(quartzDescription1 + "\n" + quartzDescription2);
                quartzDescription2 = '';
            }

            else {
                thirdHandler(quartzDescription1 + "\n" + quartzDescription3 + " " + quartzDescription2);
                quartzDescription2 = '';
                quartzDescription3 = '';
            }

            isQuartz = false;
        }, 30);
    });
})();


let quartzDescription2 = '';
(function () { // Second half
    const quartzDescription2Sig = 'e8 ?? ?? ?? ?? c6 85 80 7e 03 00 00 8d 47 ff 83 f8 02 76';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription2");

        if(hasFirstQuartzHalf === false) // Sometimes the function is called when it shouldn't
            return;

        const quartzDescriptionAddress = this.context.rdx;
        quartzDescription2 = quartzDescriptionAddress.readUtf8String();
        quartzDescription2 = cleanText(quartzDescription2);

        hasFirstQuartzHalf = false;
    });
})();


let quartzDescription3 = '';
(function () { // Second half
    const quartzDescription3Sig = '01 b3 00 08 00 00 ?? 8b 4f 10';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescription3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescription3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x19);
    console.log('[quartzDescription3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription3");

        const quartzDescriptionAddress = this.context.r9;
        quartzDescription3 = quartzDescriptionAddress.readUtf8String();
        quartzDescription3 = cleanText(quartzDescription3);
    });
})();


let itemDescription = '';
(function () { // books and key items
    const itemDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b d8 8b 97 00 08 00 00 03 d0 81 fa 00 08 00 00 72 ?? ?? 8d 0d ?? ?? ?? ?? ?? b8 42 01 00 00 ?? 8d 15 ?? ?? ?? ?? b9 03 00 00 00 e8 ?? ?? ?? ?? eb ?? ?? 8b c3 ?? 8b d6 ?? 8b cf e8 ?? ?? ?? ?? 01 9f 00 08 00 00 e9 ?? ?? ?? ?? ?? 8d ?? 40 20 00 00';
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

        const itemDescriptionAddress = this.context.rcx;
        itemDescription = itemDescriptionAddress.readUtf8String();
        itemDescription = cleanText(itemDescription);
    });
})();


(function () {
    const statusDescription1Sig = '74 ?? ?? 8b 85 a8 00 00 00 ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, statusDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[statusDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x15);
    console.log('[statusDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: statusDescription1");

        const statusDescription1Address = this.context.rdi;
        const statusDescription2Address = this.context.r8;
        let statusDescription1 = statusDescription1Address.readUtf8String();
        let statusDescription2 = statusDescription2Address.readUtf8String();
        let statusName = getName(statusDescription2Address, "status");

        statusDescription1 = cleanText(statusDescription1);
        statusDescription2 = cleanText(statusDescription2);

        secondHandler(statusName + "\n" + statusDescription1 + "\n" + statusDescription2);
    });
})();


(function () { 
    const tipsSig = 'e8 ?? ?? ?? ?? ?? 8b 57 30 ?? 8b 8b a0';
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
        let tipsName = tipsAddress.readUtf8String();
        let tipsDescription = getDescription(tipsAddress);
        tipsDescription = cleanText(tipsDescription);

        mainHandler(tipsName + "\n" + tipsDescription);
    });
})();


(function () { 
    const handbookTipsSig = 'e8 ?? ?? ?? ?? 8b 87 40 03 00 00 0f ba e0 09 72 ?? 66 c7 87 e0 06 00 00 01 01 0f ba e8 09 89 87 40 03 00 00 ?? 8b 85 a8';
    var results = Memory.scanSync(__e.base, __e.size, handbookTipsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[handbookTipsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[handbookTipsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: handbookTips");

        const handbookTipsAddress = this.context.rdx;
        let handbookTipsName = handbookTipsAddress.readUtf8String();
        let handbookTipsDescription = getDescription(handbookTipsAddress);
        handbookTipsDescription = cleanText(handbookTipsDescription);
        
        secondHandler(handbookTipsName + "\n" + handbookTipsDescription);
    });
})();


(function () { 
    const loadingTipsSig = 'e8 ?? ?? ?? ?? ?? 8b 57 30 ?? 8b 4d 30 e8';
    var results = Memory.scanSync(__e.base, __e.size, loadingTipsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[loadingTipsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[loadingTipsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: loadingTips");

        const loadingTipsAddress = this.context.rdx;
        let loadingTipsName = loadingTipsAddress.readUtf8String();
        let loadingTipsDescription = getDescription(loadingTipsAddress);
        loadingTipsDescription = cleanText(loadingTipsDescription);

        secondHandler(loadingTipsName + "\n" + loadingTipsDescription);
    });
})();


(function () { 
    const locationName1Sig = 'e8 ?? ?? ?? ?? ?? 8b 4b 60 ?? 85 c9 74 ?? ?? 63 43 54 ?? b8';
    var results = Memory.scanSync(__e.base, __e.size, locationName1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[locationName1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[locationName1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: locationName1");

        const locationNameAddress = this.context.rdx;
        let locationName = locationNameAddress.readUtf8String();
        secondHandler(locationName);
    });
})();


(function () { 
    const locationName2Sig = 'e8 ?? ?? ?? ?? ?? 8b 83 98 00 00 00 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, locationName2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[locationName2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[locationName2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: locationName2");

        const locationNameAddress = this.context.rdx;
        let locationName = locationNameAddress.readUtf8String();
        secondHandler(locationName);
    });
})();


(function () {
    const questNameBoardSig = 'e8 ?? ?? ?? ?? 8b 43 44 83 e8 01';
    var results = Memory.scanSync(__e.base, __e.size, questNameBoardSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNameBoardPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questNameBoardPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNameBoard");

        const questNameBoardAddress = this.context.rdx;
        let questNameBoard = questNameBoardAddress.readUtf8String();
        thirdHandler(questNameBoard);
    });
})();


(function () {
    const questDescriptionBoardSig = 'e8 ?? ?? ?? ?? ?? bd 00 01 00 00';
    var results = Memory.scanSync(__e.base, __e.size, questDescriptionBoardSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questDescriptionBoardPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questDescriptionBoardPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questDescriptionBoard");

        const questDescriptionBoardAddress = this.context.rdx;
        let questDescriptionBoard = questDescriptionBoardAddress.readUtf8String();
        thirdHandler("\n" + questDescriptionBoard);
    });
})();


(function () {
    const questNameHandbookSig = 'e8 ?? ?? ?? ?? 8b 46 44';
    var results = Memory.scanSync(__e.base, __e.size, questNameHandbookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNameHandbookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questNameHandbookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNameHandbook");

        const questNameHandbookAddress = this.context.rdx;
        let questNameHandbook = questNameHandbookAddress.readUtf8String();
        thirdHandler(questNameHandbook);
    });
})();


(function () {
    const questDescriptionHandbookSig = 'e8 ?? ?? ?? ?? ?? 8b 8e f8 00 00 00 8b d5 e8';
    var results = Memory.scanSync(__e.base, __e.size, questDescriptionHandbookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questDescriptionHandbookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questDescriptionHandbookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questDescriptionHandbook");

        const questDescriptionHandbookAddress = this.context.rdx;
        let questDescriptionHandbook = questDescriptionHandbookAddress.readUtf8String();
        thirdHandler("\n" + questDescriptionHandbook + "\n" + "----------------------------");
    });
})();


(function () {
    const questProgressHandbookSig = 'e8 ?? ?? ?? ?? 90 ?? 8b 5c ?? ?? eb ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, questProgressHandbookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questProgressHandbookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questProgressHandbookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgressHandbook");

        const questProgressHandbookAddress = this.context.rdx;
        let questProgressHandbook = questProgressHandbookAddress.readUtf8String();
        thirdHandler("\n" + questProgressHandbook);
    });
})();


(function () {
    const questCompletionNoteHandbookSig = 'e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 d0 00 00 00 ?? 5f ?? 5e ?? 5d ?? 5c 5f 5e 5d c3 cc';
    var results = Memory.scanSync(__e.base, __e.size, questCompletionNoteHandbookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questCompletionNoteHandbookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questCompletionNoteHandbookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questCompletionNoteHandbook");

        const questCompletionNoteHandbookAddress = this.context.rdx;
        let questCompletionNoteHandbook = questCompletionNoteHandbookAddress.readUtf8String();
        thirdHandler("\n----------------------------\n" + questCompletionNoteHandbook);
    });
})();


(function () {
    const bookSig = 'e8 ?? ?? ?? ?? ?? 8b 46 08 ?? 8b 80 a0 00 00 00 ?? 8b 98 58 02';
    var results = Memory.scanSync(__e.base, __e.size, bookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[bookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[bookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: book");

        const bookAddress = this.context.rdx;
        let book = bookAddress.readUtf8String();
        book = cleanText(book);

        secondHandler(book);
    });
})();


(function () {
    const enemyNameSig = 'e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b ce e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b ce e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, enemyNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[enemyNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[enemyNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: enemyName");

        const enemyNameAddress = this.context.rdx;
        let enemyName = enemyNameAddress.readUtf8String();
        thirdHandler(enemyName + "\n");
    });
})(); 


(function () {
    const enemyMemoSig = 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, enemyMemoSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[enemyMemoPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[enemyMemoPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: enemyMemo");

        const enemyMemoAddress = this.context.rdx;
        let enemyMemo = enemyMemoAddress.readUtf8String();
        enemyMemo = cleanText(enemyMemo);

        thirdHandler(enemyMemo);
    });
})(); 


(function () {
    const achievementsSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 f8 01 0f 85 ?? ?? ?? ?? ?? 8b 81 40 01';
    var results = Memory.scanSync(__e.base, __e.size, achievementsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[achievementsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[achievementsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: achievements");

        const achievementsAddress = this.context.rdx;
        let achievementsDescription = achievementsAddress.readUtf8String();
        let achievementsName = getName(achievementsAddress);
        achievementsDescription = cleanText(achievementsDescription);

        secondHandler(achievementsName + "\n" + achievementsDescription);
    });
})();


(function () { 
    const optionDescriptionSig = 'e8 ?? ?? ?? ?? ?? bd fe ff ff ff';
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
        optionDescription = cleanText(optionDescription);

        secondHandler(optionDescription);
    });
})();


(function () { 
    const difficultyDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? ?? 8d 4b';
    var results = Memory.scanSync(__e.base, __e.size, difficultyDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[difficultyDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[difficultyDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: difficultyDescription");

        const difficultyDescriptionAddress = this.context.rdx;
        let difficultyDescription = difficultyDescriptionAddress.readUtf8String();
        difficultyDescription = cleanText(difficultyDescription);

        secondHandler(difficultyDescription);
    });
})();


const decoder = new TextDecoder('utf-8');
function getName(address, hookName) {
    let bytes = [];

    if (hookName === "status") {
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


function getDescription(address, hookName) {
    let bytes = [];
    let nullCount = 0;

    // Skip name, read description
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

    return decoder.decode(Uint8Array.from(bytes));
}


function cleanText(text) {
    return text
        .replace(/<[^<>]*>/g, '')
        .replace(/%[a-zA-Z0-9]*(?:\.[0-9]+)?[a-zA-Z]/g, ' ')
        .replace(/[a-z][0-9]+/g, '')
        .trim();
}