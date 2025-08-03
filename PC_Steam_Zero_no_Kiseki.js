// ==UserScript==
// @name         Zero no Kiseki / Trails from Zero
// @version      1.4.13
// @author       T4uburn (found dialogue hook) & Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   NIS America
//
// https://store.steampowered.com/app/1668510/The_Legend_of_Heroes_Trails_from_Zero/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_from_zero
// ==/UserScript==


console.warn("Known issues:\n- The name of the last character's whose name was displayed will be extracted in places where it shouldn't (e.g. when reading a book/newspaper).");
console.warn("- The first quest shown on screen after selecting the chapter in the handbook might get extracted twice.");
console.warn("- There's a bit of lag when flipping back a page of a book/newspaper, which also extracts every page's text up to the current one.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, 200);
const thirdHandler = trans.send(s => s, '50+');

let name = '';
(function () {
    const nameSig = '89 54 ?? 60 ?? 8b 8f a8 00 00 00 ?? 8d 81 40 08 00 00 ?? 38 38 74 15';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[namePattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x12);
    console.log('[namePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rax;
        name = nameAddress.readShiftJisString();
    });
})();


let previousDialogue = '';
let previousDialogueAddress = null;
(function () { // Also tutorial and book/newspaper text
    const dialogueSig = '0F B6 03 3C ?? 0F 83 ?? ?? ?? ?? 48 FF C3 83 ?? ?? ?? ?? 41 8B 8C 82 ?? ?? ?? ?? 49 03 CA FF E1 66 44 89 6A';
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

        const dialogueAddress = this.context.rbx;

        
        try {
            if (dialogueAddress.equals(previousDialogueAddress.add(0x1))) {
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


let previousMenusDescription2 = '';
(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? ?? 8b bc ?? ?? ?? ?? ?? ?? 8b b4 ?? ?? ?? ?? ?? ?? 8b 9c';
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

        const menuDescription2Address = this.context.rax;

        try {
            let menuDescription2 = menuDescription2Address.readShiftJisString();

            if (menuDescription2 !== previousMenusDescription2) { // Hook is called every frame
                previousMenusDescription2 = menuDescription2;
                menuDescription2 = cleanText(menuDescription2);

                secondHandler(menuDescription2);
            }
        }
        catch (e) { /* This is purely to remove the error in a specific part of the menu */ }
    });
})();


let previousArtsDescription = '';
(function () {
    const artsDescriptionSig = '90 ?? 0f b6 04 10 88 04 ?? ?? 8d 52 01 84 c0 75';
    var results = Memory.scanSync(__e.base, __e.size, artsDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artsDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x1);
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


let previousQuartzDescription = '';
(function () {
    const quartzDescriptionSig = '0f 1f 00 ?? 0f b6 04 12 88 04 11 ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x3);
    console.log('[quartzDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription");

        const quartzDescriptionAddress = this.context.r10;
        let quartzDescription = quartzDescriptionAddress.readShiftJisString();

        if (quartzDescription !== previousQuartzDescription) { // Hook is called every frame
            previousQuartzDescription = quartzDescription;
            quartzDescription = cleanText(quartzDescription);

            secondHandler(quartzDescription);
        }
    });
})();


let previousQuestName = '';
(function () {
    const questNameSig = 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? 8d ?? 90 f3 0f 10 3d';
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

        const questNameAddress = this.context.rsi;
        let questName = questNameAddress.readShiftJisString();
        // let questName = newReadString(questNameAddress, "quest");

        if (questName !== previousQuestName) {
            previousQuestName = questName;
            previousQuestDescription = '';
            questProgressList1.clear();
            previousQuestProgress2 = '';
            

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
        thirdHandler(questDescription);
    });
})();


let questProgressList1 = new Set();
let previousQuestProgressAddress1 = null;
(function () {
    const questProgress1Sig = '75 ?? ?? 85 c0 0f 84 ?? ?? ?? ?? ?? 8b a4';
    var results = Memory.scanSync(__e.base, __e.size, questProgress1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questProgress1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.sub(0x5);
    console.log('[questProgress1Pattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress1");

        const questProgressAddress = this.context.r9;

        try {
            if (questProgressAddress.equals(previousQuestProgressAddress1)) {
                previousQuestProgressAddress1 = questProgressAddress;
                return;
            }
        }
        catch(e) {} 
        previousQuestProgressAddress1 = questProgressAddress;

        let questProgress = readString(questProgressAddress);
            
        if(questProgressList1.has(questProgress)) 
            return;

        questProgressList1.add(questProgress);
        thirdHandler(questProgress);
    });
})();


let previousQuestProgress2 = '';
let previousQuestProgressAddress2 = null;
(function () {
    const questProgress2Sig = '75 ?? ?? 85 e4 0f 84 ?? ?? ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, questProgress2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questProgress2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.sub(0x8);
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
            
        if(previousQuestProgress2 === questProgress) 
            return;

        previousQuestProgress2 = questProgress;
        thirdHandler(questProgress);
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
                    if(address.add(1).readU8() === 0x00) {
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