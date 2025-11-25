// ==UserScript==
// @name         Ao no Kiseki / Trails to Azure
// @version      1.1.19
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   NIS America
//
// https://store.steampowered.com/app/1668520/The_Legend_of_Heroes_Trails_to_Azure/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_to_azure
// ==/UserScript==


console.warn("Known issues:\n- The name of the last character's whose name was displayed will be extracted in places where it shouldn't (e.g. during the tutorial, when reading a book/newspaper).");
console.warn("- The first quest shown on screen after selecting the chapter in the handbook might get extracted twice.");
console.warn("- When reading a book or newspaper, flipping pages to previous ones will make every page's text get extracted up to the current one.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, 200);
const thirdHandler = trans.send(s => s, '50+');


let name = '';
(function () {
    const nameSig = '0f b6 13 ?? 81 c1 40 08 00 00 84 d2 74';
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
        name = nameAddress.readShiftJisString();
    });
})();



let previousDialogue = '';
let previousDialogueAddress = null;
(function () { // Also tutorial and book/newspaper text
    const dialogueSig = '0f b6 0e 80 f9 20 74 ?? 80 f9 81 75';
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

        try {
            const difference = ptr(dialogueAddress).sub(previousDialogueAddress).toInt32();
            if (difference >= 1 && difference <= 3) {
                previousDialogueAddress = dialogueAddress;
                return;
            }
        }
        catch(e) {} 
        previousDialogueAddress = dialogueAddress;

        let dialogue = readString(dialogueAddress);

        if(previousDialogue.includes(dialogue))
            return;

        previousDialogue = dialogue;
        mainHandler(name + "\n" + dialogue);
    });
})();


(function () {
    const choicesSig = 'e8 ?? ?? ?? ?? ?? 8b 4f 10 81 89';
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
        let choices = readString(choicesAddress);
        mainHandler(choices);
    });
})();


let previousMenusDescription1 = '';
(function () {
    const menuDescription1Sig = 'e8 ?? ?? ?? ?? 3d 00 04 00 00 0f 8d ?? ?? ?? ?? ?? 8b 47 40';
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

        const menuDescription1Address = this.context.rbx;
        let menuDescription1 = menuDescription1Address.readShiftJisString();

        if (menuDescription1 !== previousMenusDescription1) { // Sometimes it would print out twice
            previousMenusDescription1 = menuDescription1;
            menuDescription1 = cleanText(menuDescription1);

            secondHandler(menuDescription1);
        }
    });
})();


let previousCraftDescription = '';
(function () {
    const craftDescriptionSig = 'e8 cf 72 0c 00 ?? 83 c4 48 c3 cc';
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

        const craftDescriptionAddress = this.context.rbx;

        try {
            let craftDescription = craftDescriptionAddress.readShiftJisString();

            if (craftDescription !== previousCraftDescription && craftDescription.length >= 5) { // Hook is called every frame
                previousCraftDescription = craftDescription;
                craftDescription = cleanText(craftDescription);

                secondHandler(craftDescription);
            }
        }
        catch (e) { /* This is purely to remove the error in a specific part of the menu */ }
    });
})();


let previousArtsDescription = '';
(function () {
    const artsDescriptionSig = '0f 1f 40 00 ?? 0f b6 04 10 88 04 ?? ?? 8d 52 01 84 c0 75 ?? ?? 8b 05';
    var results = Memory.scanSync(__e.base, __e.size, artsDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artsDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x4);
    console.log('[artsDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: artsDescription");

        const artsDescriptionAddress = this.context.r8;
        let artsDescription = artsDescriptionAddress.readShiftJisString();

        if (artsDescription !== previousArtsDescription) { // Hook is called every frame
            previousArtsDescription = artsDescription;
            artsDescription = cleanText(artsDescription);

            secondHandler(artsDescription);
        }
    });
})();


let previousMasterQuartzName = '';
(function () {
    const masterQuartzNameSig = 'e8 ?? ?? ?? ?? ?? 8b 46 40 f3 0f 10 80 70 01 00 00 f3 0f 58 05 ?? ?? ?? ?? f3 0f 2c f0 f3 0f 10';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzNamePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzName");

        const masterQuartzNameAddress = this.context.r9;

        let masterQuartzName = masterQuartzNameAddress.readShiftJisString();

        if (masterQuartzName !== previousMasterQuartzName) { 
            previousMasterQuartzName = masterQuartzName;
            masterQuartzAbilitiySet.clear();

            thirdHandler(masterQuartzName + "\n");
        }
    });
})();


let masterQuartzAbilitiySet = new Set();
let previousMasterQuartzAbility = '';
(function () {
    const masterQuartzAbilitySig = 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ff c7 ?? ff c6 83 ff 06';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzAbilitySig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzAbilityPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzAbilityPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzAbility");

        const masterQuartzAbilityAddress = this.context.r9;

        let masterQuartzAbility = masterQuartzAbilityAddress.readShiftJisString();

        if (masterQuartzAbilitiySet.has(masterQuartzAbility))
            return;

        masterQuartzAbilitiySet.add(masterQuartzAbility);
        masterQuartzAbility = cleanText(masterQuartzAbility);

        thirdHandler(masterQuartzAbility);
    });
})();


let previousQuartzDescription = '';
(function () {
    const quartzDescriptionSig = '66 66 66 0f 1f 84 00 00 00 00 00 ?? 0f b6 04 12 88 04';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0xb);
    console.log('[quartzDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription");

        const quartzDescriptionAddress = this.context.rax;

        try {
            let quartzDescription = quartzDescriptionAddress.readShiftJisString();

            if (quartzDescription !== previousQuartzDescription) { // Hook is called every frame
                previousQuartzDescription = quartzDescription;
                previousMasterQuartzName = '';
                quartzDescription = cleanText(quartzDescription);

                secondHandler(quartzDescription);
            }
        }
        catch (e) { /* This is purely to remove the error in a specific part of the menu */ }
    });
})();


let previousItemDescription = '';
(function () {
    const itemDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b ac ?? ?? ?? ?? ?? ?? 8b 05';
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

        const itemDescriptionAddress = this.context.rax;

        try {
            let itemDescription = itemDescriptionAddress.readShiftJisString();

            if (itemDescription !== previousItemDescription) { // Hook is called every frame
                previousItemDescription = itemDescription;
                itemDescription = cleanText(itemDescription);

                secondHandler(itemDescription);
            }
        }
        catch (e) { /* Somehow the function tries to read something else and keeps failing. */ }
    });
})();


let previousQuestName = '';
(function () {
    const questNameSig = 'e8 ?? ?? ?? ?? ?? 8d 47 b0 c6 44 ?? ?? 00 66 0f 6e f0';
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

        const questNameAddress = this.context.rbx;
        let questName = questNameAddress.readShiftJisString();

        if (questName !== previousQuestName) {
            previousQuestName = questName;
            previousQuestDescription = '';
            previousQuestProgressAddress = null;
            questProgressList.clear();
            previousQuestProgressAddress2 = null;
            questProgressList2.clear();            

            thirdHandler(questName + "\n");
        }
    });
})();


let previousQuestDescription = '';
let previousQuestDescriptionAddress = null;
(function () {
    const questDescriptionSig = '33 c0 ?? 0f b6 11 80 fa 01 75';
    var results = Memory.scanSync(__e.base, __e.size, questDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x2);
    console.log('[questDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: questDescription");

        const questDescriptionAddress = this.context.r9;

        try {
            if (questDescriptionAddress.equals(previousQuestDescriptionAddress.add(0x1))) {
                previousQuestDescriptionAddress = questDescriptionAddress;
                return;
            }
        }
        catch(e) {} 
        previousQuestDescriptionAddress = questDescriptionAddress;

        let questDescription = readString(questDescriptionAddress);
            
        if(previousQuestDescription === questDescription) 
            return;

        previousQuestDescription = questDescription;

        setTimeout(() => {
            thirdHandler(questDescription + "\n");
        }, 30);
    });
})();


let questProgressList = new Set();
let previousQuestProgressAddress = null;
(function () {
    const questProgressSig = '0f 1f 84 00 00 00 00 00 ?? ff c0 ?? 80 3c 01 00 75 ?? ?? 85';
    var results = Memory.scanSync(__e.base, __e.size, questProgressSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questProgressPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0xb);
    console.log('[questProgressPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress");

        const questProgressAddress = this.context.r9;

        try {
            if (questProgressAddress.equals(previousQuestProgressAddress)) {
                previousQuestProgressAddress = questProgressAddress;
                return;
            }
        }
        catch(e) {} 
        previousQuestProgressAddress = questProgressAddress;

        let questProgress = readString(questProgressAddress);
            
        if(questProgressList.has(questProgress)) 
            return;

        questProgressList.add(questProgress);

        setTimeout(() => {
            thirdHandler(questProgress);
        }, 30);
    });
})();


let questProgressList2 = new Set();
let previousQuestProgressAddress2 = null;
(function () {
    const questProgress2Sig = '8b 40 18 ?? 03 c0 ?? 8b 0c 88';
    var results = Memory.scanSync(__e.base, __e.size, questProgress2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questProgress2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x10);
    console.log('[questProgress2Pattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress2");

        const questProgressAddress = this.context.r9;

        try {
            if (questProgressAddress.equals(previousQuestProgressAddress2)) {
                previousQuestProgressAddress2 = questProgressAddress;
                return;
            }
        }
        catch(e) {} 
        previousQuestProgressAddress2 = questProgressAddress;

        let questProgress = readString(questProgressAddress);
            
        if(questProgressList2.has(questProgress)) 
            return;

        questProgressList2.add(questProgress);

        setTimeout(() => {
            thirdHandler(questProgress);
        }, 30);
    });
})();


(function () {
    const prestorySig = 'e8 ?? ?? ?? ?? ?? 8b f8 ?? 8b 4b 40';
    var results = Memory.scanSync(__e.base, __e.size, prestorySig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[prestoryPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[prestoryPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory");

        const prestoryAddress = this.context.rdx;
        let prestory = prestoryAddress.readShiftJisString();
        mainHandler(prestory);
    });
})();


const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');
function readString(address) {
    let character = '';
    let sentence = "";
    const buffer = new Uint8Array(2);

    while (character = address.readU8()) {
        if(character >= 0x20) {
            buffer[0] = character;
            buffer[1] = address.add(1).readU8();
            character = decoder.decode(buffer)[0]; // ShiftJIS: 1->2 bytes.
            sentence += character;
            address = address.add(encoder.encode(character).byteLength);
        }

        else {
            switch (character) {
                case 0x01: // New line
                case 0x0a: // Big font new line?
                    sentence += "\n";
                    address = address.add(1);
                    continue;

                case 0x02: // End of bubble
                    sentence = cleanText(sentence);
                    // address = address.add(1);
                    return sentence;

                case 0x03: // Next bubble
                case 0x04: // Item logo?
                case 0x05: // Green text
                case 0x06: // ??
                case 0x07: // Color change tag
                    if(address.add(1).readU8() === 0x00) { // Avoid new line in tutorial after blue text
                        address = address.add(2);
                        continue;
                    }

                case 0x09: // Something in books/newspaper
                case 0x10: // New line in books/newspaper
                case 0x18: // End of system message?
                case 0x1f: // Item logo?
                    address = address.add(1);
                    continue;

                default:
                        console.warn(`unhandled code: ${ptr(character)}`);
                        console.warn(hexdump(address, { header: false, ansi: false, length: 0x50 }));
                        address = address.add(1);
                        continue;
            }
        }
    }
    sentence = cleanText(sentence);
    return sentence;
}



function cleanText(text) {
    return text
        .replace(/#[0-9]+R[^#]*#/g, '')
        .replace(/\b(?:[0-9]{1,2}|100)\.\d%/g, '')
        .replace(/#[0-9]+I/g, ' ')
        .replace(/#\d+[a-zA-Z]/g, '')
        .replace(/#.*?[0-9A-Za-z]/g, '')
        .replace(/^[�;\u0005!]+/, '')
        .replace(/\\n/g, '\n');
}