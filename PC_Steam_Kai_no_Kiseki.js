// ==UserScript==
// @name         Kai no Kiseki / 界の軌跡
// @version      1.06.2 r25
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom, PH3 GmbH
// * publisher   NIS America
//
// https://store.steampowered.com/app/3316940/The_Legend_of_Heroes_Trails_beyond_the_Horizon/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_beyond_the_horizon
// ==/UserScript==


console.warn("Known issues:\n- The hollow core details get extracted on the arts and quartz pages too.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '25+');


(function () {
    const nameSig = 'ff 15 ?? ?? ?? ?? 89 87 00 01 00 00 85 c0 74 ?? ?? 3b fe 74 ?? ?? 8b c0 ?? 8b d6 ?? 8b cf ff 15 ?? ?? ?? ?? 8b 87 00 01 00 00 c6 04 38 00 ?? 81';
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

        const nameAddress = this.context.rsi;
        let name = nameAddress.readUtf8String();
        mainHandler(name);
    });
})();


let mainText = '';
(function () {
    const dialogueSig = 'ff 15 ?? ?? ?? ?? 01 9e 00 08 00 00 ?? 8b';
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
        mainText = text;

        // Dialogue gets called before name
        setTimeout(() => {
            mainHandler(text);
        }, 50);
    });
})();



(function () {
    const activeVoiceSig = 'e8 ?? ?? ?? ?? 66 0f 6e c0 0f 5b c0 f3 0f 59 05 ?? ?? ?? ?? f3 0f 11 83 a0';
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

        const activeVoiceAddress = this.context.rcx;
        let activeVoice = activeVoiceAddress.readUtf8String();
        activeVoice = cleanText(activeVoice);

        mainHandler(activeVoice);
    });
})();


let systemMessage1 = '';
(function () { 
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b c8 e8 ?? ?? ?? ?? 84 c0 74 ?? ?? 8b 8b c8';
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
        systemMessage1 = systemMessageAddress.readUtf8String();
        systemMessage1 = cleanText(systemMessage1);

        if(systemMessage1.includes(mainText)) // There sometimes is an overlap between this hook and the dialogue one.
            return;

        mainHandler(systemMessage1);
    });
})();


(function () { 
    const optionDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b c0 ?? 8b d3 ?? 8b cf e8 ?? ?? ?? ?? eb ?? 80 78 20 01 0f 85';
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

        const optionDescriptionAddress = this.context.rcx;
        let optionDescription = optionDescriptionAddress.readUtf8String();
        secondHandler(optionDescription);
    });
})();


(function () {
    const choices1Sig = 'e8 ?? ?? ?? ?? f3 0f 10 35 ?? ?? ?? ?? e8';
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

        // In case there's a text box on top of the choices, which would normally be extracted last.
        setTimeout(() => {
            mainHandler(choices);
        }, 50);
    });
})();


(function () {
    const choices2Sig = 'ff 15 ?? ?? ?? ?? 8b 83 80 00 00 00 c6 04 18 00 ?? 8b 5c ?? ?? b0';
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
    const choiceThoughtsSig = 'ff 15 ?? ?? ?? ?? 8b 87 00 04 00 00 c6 04 38 00 33 c0';
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
    const negotiationChoicesSig = 'e8 ?? ?? ?? ?? ?? c7 44 ?? ?? 00 00 00 00 c7 44 ?? ?? 00 00 00 00 ?? 8d ?? ?? 28 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, negotiationChoicesSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[negotiationChoicesPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[negotiationChoicesPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: negotiationChoices");

        const negotiationChoicesAddress = this.context.rdx;
        let negotiationChoices = negotiationChoicesAddress.readUtf8String();
        mainHandler(negotiationChoices);
    });
})();


(function () { 
    const itemGetDescriptionSig = 'e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b cd e8';
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

        thirdHandler(itemGetDescription);
    });
})();


(function () { // Armor & accesory
    const equipementNameSig = 'e8 ?? ?? ?? ?? 90 ?? 8b d0 ?? 8b ce e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 80';
    var results = Memory.scanSync(__e.base, __e.size, equipementNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipementNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipementNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipementName");

        const equipementNameAddress = this.context.rbx;
        let equipementName = getName(equipementNameAddress);
        thirdHandler(equipementName);
    });
})();


(function () { 
    const materialNameSig = 'e9 ?? ?? ?? ?? ?? 8b 8c ?? e0 00 00 00 ?? 8b 46 08 ?? 8d 15 ?? ?? ?? ?? ?? 8d ?? 60 0c 00 00 e8 ?? ?? ?? ?? 90 ?? 8b d0 ?? 8b ce e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 8b 8c';
    var results = Memory.scanSync(__e.base, __e.size, materialNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[materialNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x1f);
    console.log('[materialNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: materialName");

        const materialNameAddress = this.context.r9;
        let materialName = getName(materialNameAddress);
        thirdHandler(materialName);
    });
})();


let inventory = '';
(function () {
    const inventoryDescriptionSig = 'e8 ?? ?? ?? ?? 90 eb ?? ?? 8b cf e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 40 04 00 00 5f c3 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, inventoryDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[inventoryDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[inventoryDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryDescription");

        const inventoryDescriptionAddress = this.context.rdx;
        let inventoryDescription = inventoryDescriptionAddress.readUtf8String();
        inventoryDescription = cleanText(inventoryDescription);
        inventory = inventoryDescription;

        if (inventoryDescription.includes(artDriverDescription)) // Overlap between this hook and the artDriverDescription one.
            return;

        thirdHandler(inventoryDescription);

        artDriverDescription = null;
    });
})();


let previousEquipDescription = '';
(function () { // All things on equip screen menu
    const equipDescriptionSig = 'e8 ?? ?? ?? ?? ?? 33 c9 0f 57 d2 f3 0f 10 0d ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ba';
    var results = Memory.scanSync(__e.base, __e.size, equipDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipDescription");

        const equipDescriptionAddress = this.context.rdx;
        let equipDescription = equipDescriptionAddress.readUtf8String();
        equipDescription = cleanText(equipDescription);

        if(previousEquipDescription === equipDescription)
            return;

        previousEquipDescription = equipDescription;

        thirdHandler(equipDescription);
    });
})();


let artDriverName = '';
(function () {
    const artDriverNameSig = 'e8 ?? ?? ?? ?? ?? 83 7f 10 00 0f 84 ?? ?? ?? ?? ?? 8b 0d';
    var results = Memory.scanSync(__e.base, __e.size, artDriverNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDriverNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDriverNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDriverName");

        const artDriverNameAddress = this.context.rdx;
        artDriverName = artDriverNameAddress.readUtf8String();
    });
})();


let artDriverDescription = null;
(function () { // Also material item description
    const artDriverDescriptionSig = 'e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 8b 8c ?? e0 00 00 00 ?? 8b 46 08 ?? 8d 15 ?? ?? ?? ?? ?? 8d 8d 60 0c 00 00 e8 ?? ?? ?? ?? 90 ?? 8b d0 ?? 8b ce e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 0f';
    var results = Memory.scanSync(__e.base, __e.size, artDriverDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDriverDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDriverDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDriverDescription");

        const artDriverDescriptionAddress = this.context.rdx;
        artDriverDescription = artDriverDescriptionAddress.readUtf8String();
        artDriverDescription = cleanText(artDriverDescription);

        thirdHandler(artDriverName + '\n' + artDriverDescription);
    });
})();


(function () {
    const artDescriptionSig = 'e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? 80';
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
        let artDescription = artDescriptionAddress.readUtf8String();
        artDescription = cleanText(artDescription);

        thirdHandler(artDescription);
    });
})();


(function () {
    const quartzDescription1Sig = 'e8 ?? ?? ?? ?? 90 eb ?? ?? 83 bf f8 04 00 00 00 74 ?? ?? 8b 8f 00 05 00 00 ?? 85 c9 74 ?? e8 ?? ?? ?? ?? 80 be de 00';
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

        const quartzDescription1Address = this.context.rdx;
        let quartzDescription1 = quartzDescription1Address.readUtf8String();
        quartzDescription1 = cleanText(quartzDescription1);

        thirdHandler(quartzDescription1);
    });
})();


(function () {
    const quartzDescription2Sig = 'e8 ?? ?? ?? ?? 90 eb ?? ?? 39 bf';
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

        const quartzDescription2Address = this.context.rdx;
        let quartzDescription2 = quartzDescription2Address.readUtf8String();
        quartzDescription2 = cleanText(quartzDescription2);

        thirdHandler(quartzDescription2);
    });
})();


(function () {
    const hollowCoreNameSig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4f 50 ?? 85';
    var results = Memory.scanSync(__e.base, __e.size, hollowCoreNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[hollowCoreNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[hollowCoreNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: hollowCoreName");

        const hollowCoreNameAddress = this.context.rdx;
        let hollowCoreName = hollowCoreNameAddress.readUtf8String();
        hollowCoreName = cleanText(hollowCoreName);

        thirdHandler(hollowCoreName);
    });
})();


(function () {
    const hollowCoreDescriptionSig = '74 ?? ?? 8b 90 d8 00 00 00 e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 6c';
    var results = Memory.scanSync(__e.base, __e.size, hollowCoreDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[hollowCoreDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x9);
    console.log('[hollowCoreDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: hollowCoreDescription");

        const hollowCoreDescriptionAddress = this.context.rdx;
        let hollowCoreDescription = hollowCoreDescriptionAddress.readUtf8String();

        thirdHandler('\n' + hollowCoreDescription + '\n');
    });
})();


(function () {
    const hollowCoreSBoostAbilitySig = 'ff 15 ?? ?? ?? ?? 0f b6 84';
    var results = Memory.scanSync(__e.base, __e.size, hollowCoreSBoostAbilitySig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[hollowCoreSBoostAbilityPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[hollowCoreSBoostAbilityPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: hollowCoreSBoostAbility");

        const hollowCoreSBoostAbilityAddress = this.context.rdx;
        let hollowCoreSBoostAbility = hollowCoreSBoostAbilityAddress.readUtf8String();
        hollowCoreSBoostAbility = cleanText(hollowCoreSBoostAbility);

        thirdHandler(hollowCoreSBoostAbility);
    });
})();


(function () {
    const craftDescriptionSig = 'e8 ?? ?? ?? ?? 90 eb ?? ?? 8b cf e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d';
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
        craftDescription = cleanText(craftDescription);
        mainHandler(craftDescription);
    });
})();


(function () { 
    const DLCDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b 08 ?? 8b 51 38';
    var results = Memory.scanSync(__e.base, __e.size, DLCDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[DLCDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DLCDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: DLCDescription");

        const DLCDescriptionAddress = this.context.rdx;
        let DLCDescription = DLCDescriptionAddress.readUtf8String();
        let DLCName = getName(DLCDescriptionAddress);
        DLCDescription = cleanText(DLCDescription);

        thirdHandler(DLCName + "\n" + DLCDescription);
    });
})();


(function () {
    const journalSig = 'e8 ?? ?? ?? ?? 8b 93 00 02 00 00 ?? 8b 8b a8 01 00 00 e8 ?? ?? ?? ?? ?? 8b 8b 00 02 00 00 ba 05 00 00 00 ?? 8b 0d ?? ?? ?? ?? ?? b8 02 00 00 00 e8';
    var results = Memory.scanSync(__e.base, __e.size, journalSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[journalPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[journalPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: journal");

        const journalAddress = this.context.rdx;
        let journal = journalAddress.readUtf8String();
        journal = cleanText(journal);

        secondHandler(journal);
    });
})();


(function () { 
    const tipsSig = 'e8 ?? ?? ?? ?? ?? 8b 54 3b 28 ?? 8b 4d 28 e8';
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
        let tipDescription = getDescription(tipsAddress);
        tipDescription = cleanText(tipDescription);

        mainHandler(tipName + "\n\n" + tipDescription);
    });
})();


let archiveName = '';
(function () { 
    const archive1NameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 20 ?? 8b 4f';
    var results = Memory.scanSync(__e.base, __e.size, archive1NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[archive1NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[archive1NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: archive1Name");

        const archiveAddress = this.context.rdx;
        archiveName = archiveAddress.readUtf8String();
        archiveName = cleanText(archiveName);
    });
})(); 


(function () { 
    const archive1Sig = 'e8 ?? ?? ?? ?? ?? 8b 47 04 ?? 33 c9 8b 17 ?? 8b 4f 68 e8 ?? ?? ?? ?? ?? 8b cf ?? 8b 5c ?? ?? ?? 83 c4 20 5f e9 ?? ?? ?? ?? cc ?? 89 5c';
    var results = Memory.scanSync(__e.base, __e.size, archive1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[archive1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[archive1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: archive1");

        const archive1Address = this.context.rdx;
        let archive1 = archive1Address.readUtf8String();
        archive1 = cleanText(archive1);

        thirdHandler(archiveName + '\n\n' + archive1);
    });
})();


(function () { 
    const archive2NameSig = 'e8 ?? ?? ?? ?? ?? 8b 57 10 ?? 8b 4e 38';
    var results = Memory.scanSync(__e.base, __e.size, archive2NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[archive2NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[archive2NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: archive2Name");

        const archiveAddress = this.context.rdx;
        archiveName = archiveAddress.readUtf8String();
        archiveName = cleanText(archiveName);
    });
})();


(function () { 
    const archive2Sig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? ?? 8d ?? ?? 28 ?? 3b c8 74 ?? e8 ?? ?? ?? ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, archive2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[archive2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[archive2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: archive2");

        const archiveAddress = this.context.rdx;
        let archive = archiveAddress.readUtf8String();
        archive = cleanText(archive);

        thirdHandler(archiveName + "\n\n" + archive);
    });
})();


(function () { 
    const archive3NameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 18 ?? 8b 4e 38';
    var results = Memory.scanSync(__e.base, __e.size, archive3NameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[archive3NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[archive3NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: archive3Name");

        const archiveAddress = this.context.rdx;
        archiveName = archiveAddress.readUtf8String();
        archiveName = cleanText(archiveName);
    });
})();


(function () { 
    const archive3Sig = 'e8 ?? ?? ?? ?? 8b 7e 04 8b 4d 48 33 db';
    var results = Memory.scanSync(__e.base, __e.size, archive3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[archive3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[archive3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: archive3");

        const archiveAddress = this.context.rdx;
        let archive = archiveAddress.readUtf8String();
        archive = cleanText(archive);

        thirdHandler(archiveName + "\n\n" + archive);
    });
})();


(function () {
    const questNameBoardSig = 'e8 ?? ?? ?? ?? ?? 33 c9 ?? b8 ff ff ff 7f ?? 8d 15 ?? ?? ?? ?? ?? 8b 8b c8 00 00 00 e8 ?? ?? ?? ?? ?? 8b f0';
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
        thirdHandler(questNameBoard + "\n--------------------------");
    });
})();


(function () {
    const questDescriptionBoardSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b c8 e8 ?? ?? ?? ?? 84 c0 74 ?? ba 20 00 00 00 ?? 8b ce e8 ?? ?? ?? ?? ba 07 00 00 00 ?? 8b ce e8 ?? ?? ?? ?? ?? 33';
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
        thirdHandler(questDescriptionBoard);
    });
})();


let mainNoteText = '';
(function () { 
    const mainNoteTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 53 10 ?? 8b 4c ?? ?? e8';
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

        // Wait a little bit to get all the info needed related to the main notes
        setTimeout(() => {
            secondHandler(mainNoteTitle + mainNoteText);
        }, 50);
    });
})(); 


(function () { 
    const mainNoteRequestDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 9f 18 01 00 00 33 d2 ?? b8';
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
    const mainNoteSurveyRecordSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b c8 e8 ?? ?? ?? ?? ?? 0f 57 c0 84 c0 75';
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
        mainNoteSurveyRecord = cleanText(mainNoteSurveyRecord);
        mainNoteText += "\n" + mainNoteSurveyRecord + "\n";
    });
})();


let questNoteText = '';
(function () { 
    const questNoteTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 57 10 ?? 8b 4c ?? ?? e8';
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

        // Wait a little bit to get all the info needed related to the quest notes
        setTimeout(() => {
            secondHandler(questNoteTitle + questNoteText);
        }, 50);
    });
})();


(function () { 
    const questNoteRequestDescriptionSig = 'e8 ?? ?? ?? ?? ?? b8 01 00 00 00 0f b7 17';
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
    const questNoteSurveyRecordSig = 'e8 ?? ?? ?? ?? ?? 89 46 38 ?? 8b 54 ?? 08';
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
    const toDoListTitleSig = 'e8 ?? ?? ?? ?? ?? 8b 47 40 ?? 8d 15 ?? ?? ?? ?? ?? 8d';
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

        // Wait a little bit to get all the info needed related to the to do list content
        setTimeout(() => {
            thirdHandler(toDoListTitle + toDoListText);
            toDoListText = '';
        }, 200);
    });
})();


(function () { 
    const toDoListRequestDescriptionSig = 'e8 ?? ?? ?? ?? ?? 33 c9 0f 57 d2 f3 0f 10 0d ?? ?? ?? ?? ?? 8b cd e8 ?? ?? ?? ?? ?? 33';
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
    const toDoListSurveyRecordSig = 'e8 ?? ?? ?? ?? ?? 8d 57 10 ?? 8b cb e8 ?? ?? ?? ?? ?? 33';
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
    const connectNoteTopicNameSig = 'e8 ?? ?? ?? ?? ?? 8b 53 20 ?? 8b cc e8';
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
        thirdHandler(connectNoteTopicName + '\n');
    });
})();


(function () { 
    const connectNoteTopicDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 03 ?? 0f b7';
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
        thirdHandler(connectNoteTopicDescription);
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
    const fishNoteNameSig = 'e8 ?? ?? ?? ?? ?? 83 bf 68 01 00 00 00 74 ?? ?? 8b d6';
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
        fishNoteName = cleanText(fishNoteName);

        thirdHandler(fishNoteName);
    });
})();


(function () { 
    const fishNoteDescriptionSig = 'e8 ?? ?? ?? ?? ?? 33 ed ?? 89 6c';
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
        fishNoteDescription = cleanText(fishNoteDescription);

        thirdHandler(fishNoteDescription);
    });
})();



const decoder = new TextDecoder('utf-8');
function getName(address) {
    let bytes = [];

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

    return decoder.decode(Uint8Array.from(bytes));
}


function getDescription(address) {
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
        .trim();
}