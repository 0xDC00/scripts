// ==UserScript==
// @name         Kuro no Kiseki 
// @version      1.3.5
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   NIS Ameria
//
// https://store.steampowered.com/app/2138610/The_Legend_of_Heroes_Trails_through_Daybreak/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_through_daybreak_standard_edition
// ==/UserScript==


console.warn("Known issues:\n- In the orbment menu, if you switch between characters the shard skill names and descriptions will be extracted even if you aren't on a page displaying them.");
console.warn("- If you want to read the books/newspapers you have to first flip the pages to have the first page's text extracted.");
console.warn("- When obtaining a new side quest it's possible for the text to get extracted alongside the dialogue text, if there's one.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '50+');
const fourthHandler = trans.send((s) => s, '25++');


(function () {
    const nameSig = 'e8 ?? ?? ?? ?? 89 83 00 01 00 00 85 c0 74 ?? ?? 8b c0 ?? 8b d7 ?? 8b cb e8 ?? ?? ?? ?? 8b 83 00 01 00 00 ?? 88 34 18 0f 28 74';
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

        const nameAddress = this.context.rcx;
        let name = nameAddress.readUtf8String();
        mainHandler(name);
    });
})();


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? ?? 01 b6 00 08';
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
    const systemMessage2Sig = 'e8 ?? ?? ?? ?? ?? 8b 38 ?? 85 ff 74 ?? ?? 3b ?? ?? 74 ?? ?? 8b d5 ?? 8b cf e8 ?? ?? ?? ?? 8b d8 8b d0 ?? 8d ?? 17 e8 ?? ?? ?? ?? ?? 8b c3 ?? 8b d7 ?? 8b ?? 17 e8 ?? ?? ?? ?? ?? 8b ?? ?? c6 04 18 00 ?? 8b ?? ?? ?? 85 c9 74 ?? ?? 8d ?? 07';
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
    const systemMessage3Sig = 'e8 ?? ?? ?? ?? ?? 8b d8 ?? 8b 8f 98 00 00 00 ?? 8b 11 ff 52 60 ?? 8b 8f 98 00 00 00 c7 81 e0 00 00 00 00 00 80 bf ?? c7';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage3");

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
    const tipsSig = 'e8 ?? ?? ?? ?? ?? 8b 53 28 ?? 8b 4f 20 e8';
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
    const choices2Sig = 'e8 ?? ?? ?? ?? 8b 87 80 00 00 00 c6 04 38 00 ?? 8b 7c';
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
    const choiceThoughtsSig = 'e8 ?? ?? ?? ?? ?? 8b 8c ?? a0 00 00 00 e8';
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


(function () {
    const craftDescriptionSig = 'e8 ?? ?? ?? ?? 83 a3 bc';
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


(function () {
    const itemDescriptionSig = 'eb ?? ?? 8d 15 ?? ?? ?? ?? ?? 8b ce e8';
    var results = Memory.scanSync(__e.base, __e.size, itemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0xc);
    console.log('[itemDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemDescription");

        const itemDescriptionAddress = this.context.rdx;
        let itemDescription = itemDescriptionAddress.readUtf8String();
        let itemName = readString(itemDescriptionAddress);
        itemDescription = cleanText(itemDescription);

        if (itemName === "" || itemDescription === "")
            return;

        secondHandler(itemName + "\n" + itemDescription);
    });
})();


(function () {
    const equipmentDescriptionSig = 'e8 ?? ?? ?? ?? c7 87 1c 02 00 00 00 00 80 3f c7 87 14 02 00 00 00 00 80 3f c7 87 18 02 00 00 00 00 80 3f ?? 89 a7 20 02 00 00 ?? 89';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipmentDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription");

        const equipmentDescriptionAddress = this.context.rdx;
        let equipmentDescription = equipmentDescriptionAddress.readUtf8String();
        let equipmentName = readString(equipmentDescriptionAddress);
        equipmentDescription = cleanText(equipmentDescription);

        secondHandler(equipmentName + "\n" + equipmentDescription);
    });
})();


(function () {
    const statusDescriptionSig = '8b 82 60 0c 00 00 ?? 8b b2 10 0c 00 00 ?? 8d 2c 80 ?? 8b 83 98 02';
    var results = Memory.scanSync(__e.base, __e.size, statusDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[statusDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x75);
    console.log('[statusDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: statusDescription");

        const statusDescriptionAddress = this.context.rdx;
        let statusDescription = statusDescriptionAddress.readUtf8String();
        statusDescription = cleanText(statusDescription);

        secondHandler(statusDescription);
    });
})();


let previousQuartzDescription = '';
(function () {
    const quartzDescription1Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 bf f0 04 00 00 02 0f 85 ?? ?? ?? ?? ?? 8b 87 70 05 00 00 ?? 8b 90 80 00 00 00 ?? 85 d2 0f 84 ?? ?? ?? ?? ?? 63 87 ec 02 00 00 ?? 8d 0c 40 83 bc 8f b8 02 00 00 2a 0f 85 ?? ?? ?? ?? 33 f6 39 72 28 76 ?? ?? 39 72 28 75 ?? 8b ce eb ?? ?? 63 4a 3c ?? 8b 42 20 ?? 8b 0c c8 ?? 8b 01 ff 50 30 ?? 85 c0 0f 85 ?? ?? ?? ?? 8b 97 20 05 00 00 ?? b0 01 ?? 8b 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 85 c0 74 ?? ?? 8b';
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

        const quartzDescriptionAddress = this.context.rdx;
        let quartzDescription = quartzDescriptionAddress.readUtf8String();
        let quartzName = readString(quartzDescriptionAddress);
        quartzDescription = cleanText(quartzDescription);

        if (quartzDescription === previousQuartzDescription)
            return;

        previousQuartzDescription = quartzDescription;

        secondHandler(quartzName + "\n" + quartzDescription);
    });
})();


(function () {
    const quartzDescription2Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 83 be f0 04 00 00 02 0f 85 ?? ?? ?? ?? ?? 8b 86 70 05 00 00 ?? 8b 90 80 00 00 00 ?? 85 d2 0f 84 ?? ?? ?? ?? ?? 63 86 ec 02 00 00 ?? 8d 0c 40 ?? 83 bc 8e b8 02 00 00 2a 0f 85 ?? ?? ?? ?? 83';
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

        const quartzDescriptionAddress = this.context.rdx;
        let quartzDescription = quartzDescriptionAddress.readUtf8String();
        quartzDescription = cleanText(quartzDescription);

        if (quartzDescription === previousQuartzDescription)
            return;

        previousQuartzDescription = quartzDescription;

        secondHandler(quartzDescription);
    });
})();


(function () {
    const shardSkillNameSig = 'e8 ?? ?? ?? ?? ?? 8b 46 18 ?? 8b 98 40 02 00 00 ?? 8b 80 48 02 00 00 ?? 8d 3c c3 ?? 3b df 74 ?? ?? b1 01';
    var results = Memory.scanSync(__e.base, __e.size, shardSkillNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[shardSkillNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[shardSkillNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: shardSkillName");

        const shardSkillNameAddress = this.context.rdx;
        let shardSkillName = shardSkillNameAddress.readUtf8String();
        shardSkillName = cleanText(shardSkillName);

        thirdHandler(shardSkillName);
    });
})();


(function () {
    const shardSkillDescriptionSig = 'e8 ?? ?? ?? ?? ?? 89 74 ?? ?? ?? 89 74 ?? ?? ?? 0f b6 4c';
    var results = Memory.scanSync(__e.base, __e.size, shardSkillDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[shardSkillDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[shardSkillDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: shardSkillDescription");

        const shardSkillDescriptionAddress = this.context.rdx;
        let shardSkillDescription = shardSkillDescriptionAddress.readUtf8String();
        shardSkillDescription = cleanText(shardSkillDescription);

        previousSkillDescription = '';
        previousArtDescription = '';
        previousArtDriverDescription = '';

        thirdHandler(shardSkillDescription);
    });
})();


let previousArtDriverDescription = '';
(function () {
    const artDriverDescription1Sig = 'e8 ?? ?? ?? ?? f3 0f 10 15 ?? ?? ?? ?? ?? 8b cf e8';
    var results = Memory.scanSync(__e.base, __e.size, artDriverDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDriverDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDriverDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDriverDescription1");

        const artDriverDescriptionAddress = this.context.rdx;
        let artDriverDescription = artDriverDescriptionAddress.readUtf8String();
        let artDriverName = readString(artDriverDescriptionAddress);
        artDriverDescription = cleanText(artDriverDescription);

        if (artDriverDescription === previousArtDriverDescription)
            return;

        previousArtDriverDescription = artDriverDescription;

        previousArtDescription = '';

        secondHandler(artDriverName + "\n" + artDriverDescription);
    });
})();


(function () {
    const artDriverDescription2Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 be f0 04 00 00 02 0f 85 ?? ?? ?? ?? ?? 8b 86 70 05 00 00 ?? 8b 90 80 00 00 00 ?? 85 d2 0f 84 ?? ?? ?? ?? ?? 63 86 ec 02 00 00 ?? 8d 0c 40 83 bc 8e b8 02 00 00 2a 0f 85 ?? ?? ?? ?? 83 7a 28 00 76 ?? ?? 83 7a 28 00 75 ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, artDriverDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDriverDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDriverDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDriverDescription2");

        const artDriverDescriptionAddress = this.context.rdx;
        let artDriverDescription = artDriverDescriptionAddress.readUtf8String();
        artDriverDescription = cleanText(artDriverDescription);

        if (artDriverDescription === previousArtDriverDescription)
            return;

        previousArtDriverDescription = artDriverDescription;

        secondHandler(artDriverDescription);
    });
})();


let previousArtDescription = '';
(function () {
    const artDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 bf f0 04 00 00 02 0f 85 ?? ?? ?? ?? ?? 8b 87 70 05 00 00 ?? 8b 90 80 00 00 00 ?? 85 d2 0f 84 ?? ?? ?? ?? ?? 63 87 ec 02 00 00 ?? 8d 0c 40 83 bc 8f b8 02 00 00 2a 0f 85 ?? ?? ?? ?? ?? 39';
    var results = Memory.scanSync(__e.base, __e.size, artDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDescription");

        const artDescriptionAddress = this.context.rdx;
        let artName = readString(artDescriptionAddress, "arts");
        let artDescription = artDescriptionAddress.readUtf8String();
        artDescription = cleanText(artDescription);

        if (artDescription === previousArtDescription)
            return;

        previousArtDescription = artDescription;

        previousSkillDescription = '';
        previousArtDriverDescription = '';
        previousArtPlugInDescription = '';

        secondHandler(artName + "\n" + artDescription);
    });
})();


let previousArtPlugInDescription = '';
(function () {
    const artPlugInDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 be f0 04';
    var results = Memory.scanSync(__e.base, __e.size, artPlugInDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artPlugInDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artPlugInDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artPlugInDescription");

        const artPlugInDescriptionAddress = this.context.rdx;
        let plugInName = readString(artPlugInDescriptionAddress, "plug-in");
        let artPlugInDescription = artPlugInDescriptionAddress.readUtf8String();
        artPlugInDescription = cleanText(artPlugInDescription);

        if (artPlugInDescription === previousArtPlugInDescription)
            return;

        previousArtPlugInDescription = artPlugInDescription;

        secondHandler(plugInName + "\n" + artPlugInDescription);
    });
})();


let previousSkillDescription = '';
(function () {
    const skillDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 15 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 bf f0 04 00 00 02 0f 85 ?? ?? ?? ?? ?? 8b 87 70 05 00 00 ?? 8b 90 80 00 00 00 ?? 85 d2 0f 84 ?? ?? ?? ?? ?? 63 87 ec 02 00 00 ?? 8d 0c 40 83 bc 8f b8 02 00 00 2a 0f 85 ?? ?? ?? ?? 39 6a 28 76';
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
        let skillName = readString(skillDescriptionAddress, "skill");
        let skillDescription = skillDescriptionAddress.readUtf8String();
        skillDescription = cleanText(skillDescription);

        if (skillDescription === previousSkillDescription)
            return;

        previousSkillDescription = skillDescription;

        secondHandler(skillName + "\n" + skillDescription);
    });
})();


(function () {
    const booksSig = 'e8 ?? ?? ?? ?? 8b 93 58 01 00 00 ?? 8b 8b 18 01 00 00 e8 ?? ?? ?? ?? ?? 8b';
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
    const moviePamphletsSig = 'e8 ?? ?? ?? ?? 8b 97 58 01';
    var results = Memory.scanSync(__e.base, __e.size, moviePamphletsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[moviePamphletsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[moviePamphletsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: moviePamphlets");

        const moviePamphletsAddress = this.context.rdx;
        let moviePamphlets = moviePamphletsAddress.readUtf8String();
        moviePamphlets = cleanText(moviePamphlets);

        secondHandler(moviePamphlets);
    });
})();


let prestoryName = '';
(function () { 
    const prestory1NameSig = 'e8 ?? ?? ?? ?? ?? 8b 56 18 ?? 8b cf e8';
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
    const prestory1Sig = 'e8 ?? ?? ?? ?? ?? 8b 6c ?? ?? ?? 8b 85 80 00 00 00';
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
    const prestory2NameSig = 'e8 ?? ?? ?? ?? ?? 8b 55 18 ?? 8b cf e8';
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
    const prestory2Sig = 'e8 ?? ?? ?? ?? ?? 8b 6c ?? ?? ?? 8b 06 ?? 8b';
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
    const prestory3NameSig = 'e8 ?? ?? ?? ?? ?? 8b 57 18 ?? 8b cf e8';
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
    const prestory3Sig = 'e8 ?? ?? ?? ?? ?? 0f b7 c4 ?? 0f b7 d6';
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
    const itemGetNameSig = 'e8 ?? ?? ?? ?? 90 ?? 8b 9e 40 02 00 00 ?? 8b 86 48 02 00 00 ?? 8d 3c c3 ?? 3b df 74 ?? ?? b1 01 ?? b8 fe ff ff 7f ?? 8d 15';
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

        const itemGetNameAddress = this.context.rdx;
        let itemGetName = itemGetNameAddress.readUtf8String();
        itemGetName = cleanText(itemGetName);

        mainHandler(itemGetName);
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

        mainHandler(itemGetDescription);
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
    const mainNoteRequestDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? 0f b7 93 24 01 00 00';
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
    const mainNoteSurveyRecordSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 78 0c 01 0f 84';
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


(function () { 
    const mainNoteSurveyRecordDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 47 20 ?? 8b 98 40 02 00 00 ?? 8b 80 48 02 00 00 ?? 8d 34 c3';
    var results = Memory.scanSync(__e.base, __e.size, mainNoteSurveyRecordDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[mainNoteSurveyRecordDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[mainNoteSurveyRecordDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: mainNoteSurveyRecordDescription");

        const mainNoteSurveyRecordDescriptionAddress = this.context.rdx;
        let mainNoteSurveyRecordDescription = mainNoteSurveyRecordDescriptionAddress.readUtf8String();

        if (mainNoteSurveyRecordDescription === "")
            return;

        mainNoteText += mainNoteSurveyRecordDescription + "\n";
    });
})();


let questNoteText = '';
(function () { 
    const questNoteTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 54 ?? 10 ?? 8b';
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
    const questNoteRequestDescriptionSig = 'e8 ?? ?? ?? ?? ?? 0f b7 14 ?? 66';
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
    const questNoteSurveyRecordSig = '75 ?? ?? 8b c7 ?? 89 47 38';
    var results = Memory.scanSync(__e.base, __e.size, questNoteSurveyRecordSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNoteSurveyRecordPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x10);
    console.log('[questNoteSurveyRecordPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNoteSurveyRecord");

        const questNoteSurveyRecordAddress = this.context.rdx;
        let questNoteSurveyRecord = questNoteSurveyRecordAddress.readUtf8String();
        questNoteText += "\n" + questNoteSurveyRecord + "\n";
    });
})();


(function () { 
    const questNoteSurveyRecordDescriptionSig = '75 ?? ?? 8b c7 ?? 89 47 40';
    var results = Memory.scanSync(__e.base, __e.size, questNoteSurveyRecordDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNoteSurveyRecordDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x10);
    console.log('[questNoteSurveyRecordDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNoteSurveyRecordDescription");

        const questNoteSurveyRecordDescriptionAddress = this.context.rdx;
        let questNoteSurveyRecordDescription = questNoteSurveyRecordDescriptionAddress.readUtf8String();

        if (questNoteSurveyRecordDescription === "")
            return;

        questNoteText += questNoteSurveyRecordDescription + "\n";
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
    const toDoListRequestDescriptionSig = 'e8 ?? ?? ?? ?? c7 86 1c 02 00 00 00 00 80 3f c7';
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
    const toDoListSurveyRecordSig = 'e8 ?? ?? ?? ?? f3 0f 10 46 10 f3';
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


(function () { 
    const toDoListSurveyRecordDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 8f 90 03';
    var results = Memory.scanSync(__e.base, __e.size, toDoListSurveyRecordDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[toDoListSurveyRecordDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[toDoListSurveyRecordDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: toDoListSurveyRecordDescription");

        const toDoListSurveyRecordDescriptionAddress = this.context.rdx;
        let toDoListSurveyRecordDescription = toDoListSurveyRecordDescriptionAddress.readUtf8String();

        if (toDoListSurveyRecordDescription === "")
            return;

        toDoListText += toDoListSurveyRecordDescription + "\n";
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
    const connectNoteTopicDescriptionSig = 'e8 ?? ?? ?? ?? ?? ff c6 ?? 83 c7 08 ?? 8b';
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
    const achievementDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8d ?? ?? 50 ?? 8d ?? ?? 30 e8';
    var results = Memory.scanSync(__e.base, __e.size, achievementDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[achievementDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[achievementDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: achievementDescription1");

        const achievementDescriptionAddress = this.context.rdx;
        let achievementDescription = achievementDescriptionAddress.readUtf8String();
        achievementDescription = cleanText(achievementDescription);

        fourthHandler(achievementDescription);
    });
})();


(function () { 
    const achievementDescription2Sig = 'e8 ?? ?? ?? ?? ?? 8d ?? ?? 60 01 00 00 ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, achievementDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[achievementDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[achievementDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: achievementDescription2");

        const achievementDescriptionAddress = this.context.rdx;
        let achievementDescription = achievementDescriptionAddress.readUtf8String();
        achievementDescription = cleanText(achievementDescription);

        fourthHandler(achievementDescription);
    });
})();


(function () { 
    const achievementDescription3Sig = 'e8 ?? ?? ?? ?? ?? 8b 74 ?? ?? ?? 8b 87 38 03 00 00';
    var results = Memory.scanSync(__e.base, __e.size, achievementDescription3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[achievementDescription3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[achievementDescription3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: achievementDescription3");

        const achievementDescriptionAddress = this.context.rdx;
        let achievementDescription = achievementDescriptionAddress.readUtf8String();
        achievementDescription = cleanText(achievementDescription);

        fourthHandler(achievementDescription);
    });
})();


(function () { // From the board when getting a new quest
    const questNameSig = 'e8 ?? ?? ?? ?? ?? 8b 84 ?? c0 00 00 00 ?? 8b 98 40 02 00 00';
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
    const questDescriptionSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? 83 78 0c 01 75 ?? 8b 87 10 03';
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
    const connectEventNameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 18 ?? 8b cf e8 ?? ?? ?? ?? 0f b7 03 89 44';
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
    const connectEventDescriptionSig = 'e8 ?? ?? ?? ?? 0f b7 03 89 44 ?? ?? 80';
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
    const connectEventConfirmationPromptSig = 'e8 ?? ?? ?? ?? ?? 83 8d bc';
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

    if (hookName === "craft" || hookName === "arts"|| hookName === "skill" || hookName === "plug-in") {
        // Read bytes backwards to get the name of the craft, art, etc. after the first occurrence of null bytes
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