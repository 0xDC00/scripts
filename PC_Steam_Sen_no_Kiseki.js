// ==UserScript==
// @name         Sen no Kiseki / Trails of Cold Steel
// @version      1.6
// @author       Tom (tomrock645) | readString() function based on Koukdw's version
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   XSEED Games
//
// https://store.steampowered.com/app/538680/The_Legend_of_Heroes_Trails_of_Cold_Steel/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_of_cold_steel
// ==/UserScript==


console.warn("Known issues:\n- When a character has at least two identical textboxes worth of dialogue they will all be extracted at the same time, and it's possible there'll be a random characters before the text.");
console.warn("- When opening the student handbook there will be an extraction (some text from it gets loaded the moment the handbook is opened even if it's not on screen).");
console.warn("- You might not be able to extract the content of a certain note in the handbook if you only have one entry for that category, as you might need to alternate between two entries first.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, -200);
const secondHandler = trans.send((s) => s, '200+');
const thirdHandler = trans.send((s) => s, 200);
const fourthHandler = trans.send((s) => s, '50+');


let name = '';
(function () {
    const nameSig = 'e8 ?? ?? ?? ?? 83 ?? ?? ?? ?? ?? 40 db';
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

        const nameAddress = this.context.ebx;
        name = nameAddress.readShiftJisString();
    });
})();


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? 83 c4 0c 83 bf c0 00 00 00 01 89';
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

        const dialogueAddress = this.context.esi;
        let text = readString(dialogueAddress);
        // console.warn(hexdump(dialogueAddress, { header: false, ansi: false, length: 0x50 }));

        // Dialogue hook is called before the name hook
        setTimeout(() => {
                mainHandler(name + "\n" + text);
        }, 100);
    });
})();


(function () {
    const activeVoiceSig = 'e8 ?? ?? ?? ?? d9 05 ?? ?? ?? ?? 8d 4f 04 d9 9f 94';
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

        const activeVoiceAddress = this.context.edx;
        let activeVoice = activeVoiceAddress.readShiftJisString();
        secondHandler(activeVoice);
    });
})();


(function () {
    const systemMessageSig = 'e8 ?? ?? ?? ?? 8b ?? ?? 8b d8 b8 01';
    var results = Memory.scanSync(__e.base, __e.size, systemMessageSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessagePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessagePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage");

        const systemMessageAddress = this.context.esi;
        let systemMessage = readString(systemMessageAddress);
        secondHandler(systemMessage);
    });
})();


(function () {
    const choicesSig = 'ff d2 e9 f5 01 00 00 3c 02 75 6d 6a 01 8d 45 f9 57 50 e8 eb 26 db ff 6a 02 47';
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

        const choicesAddress = this.context.ebx;
        let choices = choicesAddress.readShiftJisString();
        secondHandler(choices);
    });
})();


let previousMenusDescription = '';
let previousInventoryDescription = '';
(function () { // Also inventory and crafts (from the main menu) 
    const menuDescriptionSig = '50 e8 ?? ?? ?? ?? 8b ?? ?? 5f 5e 33 cd 5b e8 ?? ?? ?? ?? 8b e5 5d c3';
    var results = Memory.scanSync(__e.base, __e.size, menuDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(1);
    console.log('[menuDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription");

        const menuDescriptionAddress = this.context.eax;

        try {
            const inventoryDescriptionAddress = this.context.esp.readPointer();
            let menuDescription = menuDescriptionAddress.readShiftJisString();
            let inventoryDescription = inventoryDescriptionAddress.readShiftJisString();

            if (menuDescription !== previousMenusDescription && menuDescription.length >= 5) {
                previousMenusDescription = menuDescription;
                menuDescription = cleanText(menuDescription);

                thirdHandler(menuDescription);
            }

            else if (inventoryDescription !== previousInventoryDescription) {
                previousInventoryDescription = inventoryDescription;
                inventoryDescription = inventoryDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

                thirdHandler(inventoryDescription);
            }
        }
        catch (e) { }
    });
})();


let previousArtsDescription = '';
(function () {
    const artsDescriptionSig = 'e8 ?? ?? ?? ?? 5b 66 8b c7 5f 5e c3 8b 4e 5c 8b 81 c0 01 00 00';
    var results = Memory.scanSync(__e.base, __e.size, artsDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artsDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artsDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artsDescription");

        const artsDescriptionAddress = this.context.eax;
        let artsDescription = artsDescriptionAddress.readShiftJisString();

        if (artsDescription !== previousArtsDescription) {
            previousArtsDescription = artsDescription;
            artsDescription = artsDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');;

            thirdHandler(artsDescription);
        }
    });
})();


let masterQuartzAbilitiySet = new Set();
(function () {
    const masterQuartzAbilitySig = 'e8 ?? ?? ?? ?? 8d ?? fc fb ff ff 50 8d ?? fc fd ff ff 51 68';
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

        const masterQuartzAbilityAddress = this.context.eax;

        let masterQuartzAbility = masterQuartzAbilityAddress.readShiftJisString();

        if (masterQuartzAbilitiySet.has(masterQuartzAbility))
            return;

        masterQuartzAbilitiySet.add(masterQuartzAbility);
        masterQuartzAbility = masterQuartzAbility.replace(/%[a-zA-Z0-9]+/g, ' ');

        fourthHandler(masterQuartzAbility);
    });
})();


let previousQuartzDescription1 = '';
(function () {
    const quartzDescription1Sig = 'e8 ?? ?? ?? ?? 5b 66 8b c7 5f 5e c3 5f b8 0f';
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

        const quartzDescription1Address = this.context.edx;
        let quartzDescription1 = quartzDescription1Address.readShiftJisString();

        if (quartzDescription1 !== previousQuartzDescription1) {
            previousQuartzDescription1 = quartzDescription1;
            masterQuartzAbilitiySet.clear();
            quartzDescription1 = quartzDescription1.replace(/#\d{1,3}[a-zA-Z]/g, '');;

            thirdHandler(quartzDescription1);
        }
    });
})();


let previousQuartzDescription2 = '';
(function () {
    const quartzDescription2Sig = 'e8 ?? ?? ?? ?? 5b 66 8b c7 5f 5e c3 6a 42';
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

        const quartzDescription2Address = this.context.eax;
        let quartzDescription2 = quartzDescription2Address.readShiftJisString();

        if (quartzDescription2 !== previousQuartzDescription2) {
            previousQuartzDescription2 = quartzDescription2;
            quartzDescription2 = quartzDescription2.replace(/#\d{1,3}[a-zA-Z]/g, '');;

            thirdHandler(quartzDescription2);
        }
    });
})();


let previousEquipmentDescription = '';
(function () {
    const equipmentDescription1Sig = 'e8 ?? ?? ?? ?? 5f 5e 66 8b c3 5b c3 5e b8 0f';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipmentDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription1");

        const equipmentDescription1Address = this.context.edx;
        let equipmentDescription1 = equipmentDescription1Address.readShiftJisString();

        if (equipmentDescription1 !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription1;
            equipmentDescription1 = equipmentDescription1.replace(/#\d{1,3}[a-zA-Z]/g, '');

            thirdHandler(equipmentDescription1);
        }
    });
})();


(function () {
    const equipmentDescription2Sig = 'e8 ?? ?? ?? ?? 5f 5e 66 8b c3 5b c3 6a 42 8b 0d';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipmentDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription2");

        const equipmentDescription2Address = this.context.eax;
        let equipmentDescription2 = equipmentDescription2Address.readShiftJisString();

        if (equipmentDescription2 !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription2;
            equipmentDescription2 = equipmentDescription2.replace(/#\d{1,3}[a-zA-Z]/g, '');

            thirdHandler(equipmentDescription2);
        }
    });
})();


(function () { // Description of crafts and arts
    const battleDescriptionSig = 'e8 ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? 8b 8a 78 02';
    var results = Memory.scanSync(__e.base, __e.size, battleDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[battleDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[battleDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: battleDescription");

        const battleNameAddress = this.context.eax.add(12).readPointer();
        const battleDescriptionAddress = this.context.eax.add(16).readPointer();
        let battleName = battleNameAddress.readShiftJisString();
        let battleDescription = battleDescriptionAddress.readShiftJisString();

        battleDescription = battleDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
        thirdHandler(battleName + "\n" + battleDescription);
    });
})();


(function () { 
    const battleItemDescriptionSig = 'e8 ?? ?? ?? ?? 8b 15 ?? ?? ?? ?? 8b 8a 5c 63 0b';
    var results = Memory.scanSync(__e.base, __e.size, battleItemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[battleItemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[battleItemDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: battleItemDescription");

        const battleItemNameAddress = this.context.eax.add(12).readPointer();
        const battleItemDescriptionAddress = this.context.eax.add(16).readPointer();
        let battleItemName = battleItemNameAddress.readShiftJisString();
        let battleItemDescription = battleItemDescriptionAddress.readShiftJisString();

        battleItemDescription = battleItemDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
        thirdHandler(battleItemName + "\n" + battleItemDescription);
    });
})();


(function () { // And side quest notes
    const mainNoteSig = 'e8 ?? ?? ?? ?? 8b ?? ?? 40 0f b7 d8 89';
    var results = Memory.scanSync(__e.base, __e.size, mainNoteSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[mainNotePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[mainNotePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: mainNote");

        const mainNoteAddress = this.context.edx;
        let mainNote = mainNoteAddress.readShiftJisString();
        mainNote = cleanText(mainNote);

        secondHandler(mainNote);
    });
})();


(function () { // When viewing new quests from a letter
    const questSig = '8b 40 04 83 e2 01 2b c2 50 e8 ?? ?? ?? ?? 5d c2 08 00';
    var results = Memory.scanSync(__e.base, __e.size, questSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x8);
    console.log('[questPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quest");

        const questAddress = this.context.eax;
        let quest = questAddress.readShiftJisString();
        quest = cleanText(quest);

        fourthHandler(quest);
    });
})();


let previousCharacterNote1 = '';
(function () {
    const characterNote1Sig = 'e8 ?? ?? ?? ?? d9 ?? ?? dc 25 ?? ?? ?? ?? bf';
    var results = Memory.scanSync(__e.base, __e.size, characterNote1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNote1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNote1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNote1");

        const characterNote1Address = this.context.esp.add(8).readPointer();
        let characterNote1 = characterNote1Address.readShiftJisString();

        if (characterNote1 !== previousCharacterNote1) {
            // To extract the additional character details again if the next one viewed doesn't have any unlocked and then back to the same character
            characterDetailsSet.clear();
            previousCharacterNote2 = '';

            previousCharacterNote1 = characterNote1;
            fourthHandler(characterNote1);
        }
    });
})();


let previousCharacterNote2 = '';
let currentCharacterNote = '';
let characterDetailsSet = new Set();
(function () {
    const characterNote2Sig = 'e8 ?? ?? ?? ?? d9 ?? ?? bf 03 00 00 00 dc 25';
    var results = Memory.scanSync(__e.base, __e.size, characterNote2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNote2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNote2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNote2");

        const characterNote2Address = this.context.esp.add(8).readPointer();
        let characterNote2 = characterNote2Address.readShiftJisString();

        if (characterNote2 !== previousCharacterNote2 && !characterDetailsSet.has(characterNote2)) {
            previousCharacterNote2 = characterNote2;
            characterDetailsSet.add(characterNote2);

            fourthHandler("\n" + characterNote2);
        }
    });
})();


let previousFishNote = '';
(function () {
    const fishNoteSig = 'e8 ?? ?? ?? ?? 89 ?? ?? bf 04 00 00 00 90 8b';
    var results = Memory.scanSync(__e.base, __e.size, fishNoteSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[fishNotePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[fishNotePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: fishNote");

        const fishNoteAddress = this.context.edx;            
        let fishNote = fishNoteAddress.readShiftJisString();

        if(fishNote === previousFishNote)
            return;

        previousFishNote = fishNote;
        thirdHandler(fishNote);
    });
})();


let previousShopItemDescription = '';
(function () {
    const shopItemDescriptionSig = '2b c2 50 8b cb e8 ?? ?? ?? ?? 5b 5f 5e 8b e5 5d c3';
    var results = Memory.scanSync(__e.base, __e.size, shopItemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[shopItemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(5);
    console.log('[shopItemDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: shopItemDescription");

        const shopItemDescriptionAddress = this.context.eax;
        let shopItemDescription = shopItemDescriptionAddress.readShiftJisString();

        if (shopItemDescription !== previousShopItemDescription) {
            previousShopItemDescription = shopItemDescription;
            shopItemDescription = cleanText(shopItemDescription);

            thirdHandler(shopItemDescription);
        }
    });
})();


let previousBookAddress = null;
(function () {
    const bookSig = '8a 08 40 84 c9 75 ?? 2b c2 40 6a 02 50 89 ?? ?? e8 ?? ?? ?? ?? 8b f0 83 c4 08 3b f7 74 ';
    var results = Memory.scanSync(__e.base, __e.size, bookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[bookPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(5);
    console.log('[bookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: book");

        const bookAddress = this.context.edx.sub(1);

        try {
            if (previousBookAddress.equals(bookAddress)) {
                previousBookAddress = bookAddress;
                return;
            }
        }
        catch(e) {}
        previousBookAddress = bookAddress;
        
        let book = bookAddress.readShiftJisString();
        book = cleanText(book);

        thirdHandler(book);
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

            if (address.add(1).readU8() === 0x00 && address.add(3).readU8() === 0x23)
                address = address.add(3);
        }

        else {
            switch (character) {
                case 0x01: // New line
                    sentence += "\n";
                    address = address.add(1);
                    continue;

                case 0x02: // Next bubble
                    sentence += "\n";
                    address = address.add(1);
                    continue;

                case 0x03: // End of bubble
                    sentence += "\n";
                    address = address.add(1);
                    continue;

                case 0x06:
                case 0x07:
                case 0x08:
                case 0x0b: // Green text
                case 0x0c: // Item logo
                    address = address.add(1);
                    continue;

                case 0x0e: // Item reference?
                    address = address.add(3);
                    continue;

                case 0x10: // Red text
                    address = address.add(1);
                    continue;

                case 0x11: // Voice command
                case 0x12:
                    address = address.add(5);
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
        // There probably are a few that are now useless but I'm too lazy to test them out individually
        .replace(/#\d{3}[a-zA-Z]/g, '')
        .replace(/#-\d{3}[a-zA-Z]+/g, '')
        .replace(/#.*?#/g, '')
        .replace(/[a-z]\d[A-Z]#/g, '')         // Remove things like y0T#
        .replace(/[a-z]?[A-Z]\[\d+\]/g, '')    // Remove things like M[9], vM[0]
        .replace(/[a-z]?[A-Z]\d+/g, '')        // Remove things like M0, bM0
        .replace(/[a-z]\d\b/g, '')             // Remove things like z0
        .replace(/[a-zA-Z0-9]_[a-zA-Z0-9]/g, '')
        .replace(/[a-zA-Z0-9][a-zA-Z0-9]/g, '')
        .replace(/%\d+d/g, '')
        .replace(/^[a-zA-Z0-9]$/, '')
        .replace(/\b\d{3}y\b/g, '')
        .replace(/ｴ/g, '')
        .replace(/Iv@/g, '')
        .replace(/#\w+/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/[\uFF61-\uFF9F`㈱}#@�-]/g, '')
        .replace(/[ \t\f\v\u00A0\u2028\u2029]+/g, '') // Whitespace except new line
        .replace(/\\n/g, '\n');
}