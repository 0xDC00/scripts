// ==UserScript==
// @name         Sen no Kiseki II / Trails of Cold Steel II 
// @version      1.4.1
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   XSEED Games
//
// https://store.steampowered.com/app/748490/The_Legend_of_Heroes_Trails_of_Cold_Steel_II/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_of_cold_steel_ii
// ==/UserScript==

// overlap? ed8_2_PC_JP.exe+5594

console.warn("Known issues:\n- More often than not, when a character has more than one textbox worth of dialogue everything will be extracted at the same time, and it's possible there'll be a random characters before the text.");
console.warn("- When opening the student handbook there will be an extraction (some text from it gets loaded the moment the handbook is opened even if it's not on screen).");
console.warn("- You might not be able to extract the content of a certain note in the handbook if you only have one entry for that category, as you might need to alternate between two entries first.");
console.warn("- Choices that are or can be preceded by a star won't be extracted (applies only to a certain terminal?).");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, -200);
const secondHandler = trans.send((s) => s, '200+');
const thirdHandler = trans.send((s) => s, 200);
const fourthHandler = trans.send((s) => s, '50+');


let name = '';
(function () {
    const nameSig = 'e8 ?? ?? ?? ?? f3 0f 10 ?? ?? 83 c4 04 51 f3 0f 11 04';
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

        const nameAddress = this.context.edi;
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

        // console.warn(hexdump(dialogueAddress, { header: false, ansi: false, length: 0x100 }));

        // Dialogue hook is called before the name hook
        setTimeout(() => {
                mainHandler(name + "\n" + text);
        }, 100);
    });
})();


(function () {
    const activeVoiceSig = 'ff 15 ?? ?? ?? ?? 83 c4 0c c7 86 30 03';
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

        const activeVoiceAddress = this.context.esp.add(4).readPointer();
        let activeVoice = activeVoiceAddress.readShiftJisString();
        secondHandler(activeVoice);
    });
})();


(function () {
    const systemMessageSig = 'e8 ?? ?? ?? ?? 83 c4 0c 83 be c0 00 00 00 01 8b d8 0f 84';
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

        const systemMessageAddress = this.context.ebx;
        let systemMessage = readString(systemMessageAddress);
        secondHandler(systemMessage);
    });
})();


(function () {
    const choices1Sig = 'ff 52 7c e9 ?? ?? ?? ?? 3c 02 0f 85 ?? ?? ?? ?? 8d 5e 01 3b f3 73 ?? 8b c3 2b c6 50 8d ?? f9';
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

        const choicesAddress = this.context.ebx;
        let choices = choicesAddress.readShiftJisString();
        secondHandler(choices);
    });
})();


(function () {
    const choices2Sig = 'ff 52 7c e9 ?? ?? ?? ?? 3c 02 0f 85 ?? ?? ?? ?? 8d 5e 01 3b f3 73 ?? 8b c3 2b c6 50 8d ?? f1';
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

        const choicesAddress = this.context.ebx;
        let choices = choicesAddress.readShiftJisString();
        choices = choices.replace(/#\d{1,3}[a-zA-Z]/g, '');
        secondHandler(choices);
    });
})();


let previousMenusDescription = '';
(function () {
    const menuDescription1Sig = '8b cb e8 ?? ?? ?? ?? 8b ?? ?? 64 89 0d ?? ?? ?? ?? 59 5f 5e 5b 8b ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(2);
    console.log('[menuDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription1");

        const menuDescriptionAddress = this.context.eax;

        try {
            let menuDescription = menuDescriptionAddress.readShiftJisString();
            menuDescription = cleanText(menuDescription);

            if (menuDescription !== previousMenusDescription && menuDescription.length >= 5) {
                previousMenusDescription = menuDescription;

                thirdHandler(menuDescription);
            }
        }
        catch (e) { }
    });
})();


(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? 66 8b c3 8b ?? ?? 64 89 0d ?? ?? ?? ?? 59 5f 5e 5b 8b e5 5d c3 6a 6a';
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

        const menuDescriptionAddress = this.context.eax;

        try {
            let menuDescription = menuDescriptionAddress.readShiftJisString();
            menuDescription = cleanText(menuDescription);

            if (menuDescription !== previousMenusDescription && menuDescription.length >= 5) {
                previousMenusDescription = menuDescription;

                thirdHandler(menuDescription);
            }
        }
        catch (e) { }
    });
})();


let previousEquipmentDescription = '';
(function () { // Also quartz and item descriptions (most)
    const equipmentDescription1Sig = '50 e8 ?? ?? ?? ?? 8b ?? ?? 64 89 0d ?? ?? ?? ?? 59 5f 5e 5b 8b ?? ?? 33 cd e8 ?? ?? ?? ?? 8b e5 5d c2 08 00';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(1);
    console.log('[equipmentDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription1");

        const equipmentDescriptionAddress = this.context.eax;
        let equipmentDescription = equipmentDescriptionAddress.readShiftJisString();

        if (equipmentDescription !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription;
            equipmentDescription = equipmentDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            thirdHandler(equipmentDescription);
        }
    });
})();


(function () { // Also quartz and item descriptions (very few)
    const equipmentDescription2Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 68 ?? ?? ?? ?? e8 ?? ?? ?? ?? 8b 0d ?? ?? ?? ?? 68';
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

        const equipmentDescriptionAddress = this.context.eax.readPointer();
        let equipmentDescription = equipmentDescriptionAddress.readShiftJisString();

        if (equipmentDescription !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription;
            equipmentDescription = equipmentDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            previousMasterQuartzName = '';

            thirdHandler(equipmentDescription);
        }
    });
})();


let previousArtDescription = '';
(function () { // Also all descriptions in battles
    const artDescription1Sig = 'e8 ?? ?? ?? ?? 8a c3 f6 d0 c7 ?? ?? ff ff ff ff a8 01 74 ?? 53 e8 ?? ?? ?? ?? 83 c4 04 eb ?? 0f';
    var results = Memory.scanSync(__e.base, __e.size, artDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDescription1");

        const artDescriptionAddress = this.context.eax;
        let artDescription = artDescriptionAddress.readShiftJisString();

        if (artDescription !== previousArtDescription) {
            previousArtDescription = artDescription;
            artDescription = artDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            thirdHandler(artDescription);
        }
    });
})();


(function () { 
    const artDescription2Sig = '8b cf e8 ?? ?? ?? ?? 8b ?? ?? 64 89 0d ?? ?? ?? ?? 59 5f 5e 5b 8b ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, artDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x2);
    console.log('[artDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDescription2");

        const artDescriptionAddress = this.context.eax;
        let artDescription = artDescriptionAddress.readShiftJisString();

        if (artDescription !== previousArtDescription) {
            previousArtDescription = artDescription;
            artDescription = artDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            thirdHandler(artDescription);
        }
    });
})();


let previousMasterQuartzName = '';
(function () { 
    const masterQuartzNameSig = 'e8 ?? ?? ?? ?? c7 ?? ?? ?? ?? ?? 00 00 00 00 8b ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? 33';
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

        const masterQuartzNameAddress = this.context.esi;
        let masterQuartzName = masterQuartzNameAddress.readShiftJisString();

        if (masterQuartzName !== previousMasterQuartzName) {
            previousMasterQuartzName = masterQuartzName;
            masterQuartzName = masterQuartzName.replace(/#\d{1,3}[a-zA-Z]/g, '');
            masterQuartzAbilitiySet.clear();

            fourthHandler(masterQuartzName + "\n");
        }
    });
})();


let masterQuartzAbilitiySet = new Set();
(function () {
    const masterQuartzAbilitySig = 'e8 ?? ?? ?? ?? 8d ?? fc fb ff ff 50 8d ?? fc fd ff ff 50 68';
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

        try {
            const masterQuartzAbilityAddress = this.context.esp.add(8).readPointer();

            let masterQuartzAbility = masterQuartzAbilityAddress.readShiftJisString();

            if (masterQuartzAbilitiySet.has(masterQuartzAbility))
                return;

            masterQuartzAbilitiySet.add(masterQuartzAbility);
            masterQuartzAbility = masterQuartzAbility.replace(/%[a-zA-Z]/g, ' ');

            fourthHandler(masterQuartzAbility);
        }
        catch(e) {}
    });
})();


let previousOptionDescription = '';
(function () {
    const optionDescriptionSig = 'e8 ?? ?? ?? ?? 83 c7 08 50 8b cf e8 ?? ?? ?? ?? 8d ?? 58';
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

        const optionDescriptionAddress = this.context.esp.add(4).readPointer();
        let optionDescription = optionDescriptionAddress.readShiftJisString();
        optionDescription = cleanText(optionDescription);

        if (optionDescription !== previousOptionDescription) {
            previousOptionDescription = optionDescription;

            thirdHandler(optionDescription);
        }
    });
})();


(function () { // And side quest notes
    const mainNotesSig = 'e8 ?? ?? ?? ?? 43 0f b7 fb 3b';
    var results = Memory.scanSync(__e.base, __e.size, mainNotesSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[mainNotesPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[mainNotesPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: mainNotes");

        const mainNotesAddress = this.context.eax;
        let mainNotes = mainNotesAddress.readShiftJisString();
        mainNotes = cleanText(mainNotes);

        secondHandler(mainNotes);
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

        secondHandler(quest);
    });
})();


let previousCharacterNote1 = '';
(function () {
    const characterNote1Sig = 'e8 ?? ?? ?? ?? f3 0f 10 ?? ?? f3 0f 5c 0d ?? ?? ?? ?? bf 04 00 00 00 f3';
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
        // characterNote1 = cleanText(characterNote1);

        if (characterNote1 !== previousCharacterNote1) {
            // To extract the additional character details again if the next one viewed doesn't have any unlocked and then back to the same character
            characterDetailsSet.clear();
            previousCharacterNote2 = '';

            previousCharacterNote1 = characterNote1;
            characterNote1 = characterNote1.replace(/#\d{1,3}[a-zA-Z]/g, '');
            secondHandler(characterNote1);
        }
    });
})();


let previousCharacterNote2 = '';
let currentCharacterNote = '';
let characterDetailsSet = new Set();
(function () {
    const characterNote2Sig = 'e8 ?? ?? ?? ?? f3 0f 10 ?? ?? f3 0f 5c 0d ?? ?? ?? ?? bf 03 00 00 00 f3';
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
            characterNote2 = characterNote2.replace(/#\d{1,3}[a-zA-Z]/g, '');

            secondHandler("\n" + characterNote2);
        }
    });
})();


let previousFishNote = '';
(function () {
    const fishNoteSig = 'e8 ?? ?? ?? ?? 33 ff 8d 5f 04 f3 0f 7e';
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

        const fishNoteAddress = this.context.esp.add(8).readPointer();            
        let fishNote = fishNoteAddress.readShiftJisString();

        if(fishNote === previousFishNote)
            return;

        previousFishNote = fishNote;
        thirdHandler(fishNote);
    });
})();


let previousBookAddress = null;
(function () {
    const bookSig = '8a 01 41 84 c0 75 ?? 2b ca 6a 02 8d 41 01 50 89 ?? ?? e8 ?? ?? ?? ?? 8b d8 83 c4 08 85 db 74 ?? ff ?? ?? 57 53 e8 ?? ?? ?? ?? 83 c4 0c eb';
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


let previousBikeCustomization = '';
(function () {
    const bikeCustomizationSig = '68 64 02 00 00 f3 0f 2c c0 50 e8';
    var results = Memory.scanSync(__e.base, __e.size, bikeCustomizationSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[bikeCustomizationPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[bikeCustomizationPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: bikeCustomization");

        const bikeCustomizationAddress = this.context.eax;
        let bikeCustomization = bikeCustomizationAddress.readShiftJisString();

        if(bikeCustomization === previousBikeCustomization)
            return;

        previousBikeCustomization = bikeCustomization;

        thirdHandler(bikeCustomization);
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
                    address = address.add(1);
                    continue;

                case 0x03: // End of bubble
                    sentence += "\n\n";
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
        .replace(/\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/g, '') // Date and time
        .replace(/#\d{3}[a-zA-Z]/g, '')
        .replace(/#.*?#/g, '')
        .replace(/\b[a-zA-Z0-9]_[a-zA-Z0-9]\b/g, '')
        .replace(/[a-z]\d[A-Z]#/g, '')                  // Remove things like y0T#
        .replace(/[a-z]?[A-Z]\[[a-zA-Z0-9]\]/g, '')     // Remove things like M[9], vM[0]
        .replace(/[a-z]?[A-Z]\d+/g, '')                 // Remove things like M0, bM0
        .replace(/[a-z]\d\b/g, '')                      // Remove things like z0
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