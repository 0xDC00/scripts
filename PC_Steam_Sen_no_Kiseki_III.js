// ==UserScript==
// @name         Sen no Kiseki III / Trails of Cold Steel III 
// @version      1.06
// @author       Tom (tomrock645) | readString() function based on Koukdw's version
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   XSEED Games
//
// https://store.steampowered.com/app/991270/The_Legend_of_Heroes_Trails_of_Cold_Steel_III/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_of_cold_steel_iii
// ==/UserScript==


console.warn("Known issues:\n- When a character has at least two textboxes worth of dialogue they might all be extracted at the same time.");
console.warn("- There will be an extraction when you open the instructor handbook or open the 'help' section from the system menu.");

const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '50+');


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? eb ?? ?? 8d 05 ?? ?? ?? ?? ba 00 04 00 00 ?? 8d 4c ?? 30 e8 ?? ?? ?? ?? ?? 0f';
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

        const nameAddress = this.context.rdx;
        const textAddress = this.context.r8;

        let name = nameAddress.readUtf8String();
        let text = readString(textAddress);

        // console.warn(hexdump(textAddress, { header: false, ansi: false, length: 0x100 }));
        mainHandler(name + "\n" + text);
    });
})();


(function () {
    const activeVoiceSig = 'ff 15 ?? ?? ?? ?? 33 c0 c7 83 dc 07 00 00 00 00 80 3f ?? 89 83 c0 07 00 00 89';
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
    const choicesSig = 'ff 90 28 01 00 00 e9 ?? ?? ?? ?? ?? 80';
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


(function () { // Mostly tutorial messages
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? 2b';
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

        const systemMessage1Address = this.context.r8;
        let systemMessage1 = readString(systemMessage1Address);
        // console.warn(hexdump(systemMessage1Address, { header: false, ansi: false, length: 0x100 }));
        mainHandler(systemMessage1);
    });
})();


(function () {
    const systemMessage2Sig = 'ff 15 ?? ?? ?? ?? ?? 8b ce ?? 89 be c0';
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

        const systemMessage2Address = this.context.rdx;
        let systemMessage2 = systemMessage2Address.readUtf8String();
        systemMessage2 = systemMessage2.replace(/#\d{1,3}[a-zA-Z]/g, '');

        mainHandler(systemMessage2);
    });
})();


let previousMenusDescription = '';
(function () {
    const menuDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b 8d d0 01';
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

        if (menuDescription !== previousMenusDescription) {
            previousMenusDescription = menuDescription;
            secondHandler(menuDescription);
        }
    });
})();


(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? 0f b7 c5 e9';
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

        if (menuDescription !== previousMenusDescription) {
            previousMenusDescription = menuDescription;
            secondHandler(menuDescription);
        }
    });
})();


let previousOrbmentMenu = '';
(function () {
    const orbmentMenuSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ba 03 01';
    var results = Memory.scanSync(__e.base, __e.size, orbmentMenuSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[orbmentMenuPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[orbmentMenuPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: orbmentMenu");

        const orbmentMenuAddress = this.context.rax;
        let orbmentMenu = orbmentMenuAddress.readUtf8String();

        if (orbmentMenu !== previousOrbmentMenu) {
            previousOrbmentMenu = orbmentMenu;
            orbmentMenu = cleanText(orbmentMenu);

            secondHandler(orbmentMenu);
        }
    });
})();


let previousMasterQuartzDescription = '';
(function () {
    const masterQuartzDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 81 c4 98 0c 00 00';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzDescription1");

        const masterQuartzDescriptionAddress = this.context.rdx;
        let masterQuartzDescription = masterQuartzDescriptionAddress.readUtf8String();

        if (masterQuartzDescription !== previousMasterQuartzDescription) {
            previousMasterQuartzDescription = masterQuartzDescription;
            secondHandler(masterQuartzDescription);
        }
    });
})();


(function () {
    const masterQuartzDescription2Sig = 'e8 ?? ?? ?? ?? 0f b7 c5 eb ?? b8';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzDescription2");

        const masterQuartzDescriptionAddress = this.context.rdx;
        let masterQuartzDescription = masterQuartzDescriptionAddress.readUtf8String();

        if (masterQuartzDescription !== previousMasterQuartzDescription) {
            masterQuartzAbilities.clear();
            previousMasterQuartzAbility = '';

            previousMasterQuartzDescription = masterQuartzDescription;
            masterQuartzDescription = cleanText(masterQuartzDescription);
            
            thirdHandler(masterQuartzDescription + "\n");
        }
    });
})();


let masterQuartzAbilities = new Set();
let previousMasterQuartzAbility = '';
(function () { // Also some items from inventory
    const masterQuartzAbilitySig = 'e8 ?? ?? ?? ?? ?? 8b d8 ?? 85 c0 74 ?? ?? 8b 7c ?? ?? ?? 8b 0f ?? 85 c9 74 ?? 0f b6 d1 f6 d2 f6 c2 01 74 ?? e8 ?? ?? ?? ?? ?? 89 1f ?? 8b';
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

        const masterQuartzAbilityAddress = this.context.rcx;
        let masterQuartzAbility = masterQuartzAbilityAddress.readUtf8String();

        if (masterQuartzAbility !== previousMasterQuartzAbility && !masterQuartzAbilities.has(masterQuartzAbility)) {
            previousMasterQuartzAbility = masterQuartzAbility;
            masterQuartzAbilities.add(masterQuartzAbility);
            masterQuartzAbility = cleanText(masterQuartzAbility);

            thirdHandler(masterQuartzAbility);
        }
    });
})();


let previousQuartzDescription = '';
(function () { // Also some items from inventory and craft descriptions
    const quartzDescriptionSig = 'e8 ?? ?? ?? ?? 0f b6 8f a5 02 00 00 85 c9 74 ?? 83 e9 01 74 ?? 83 f9 01 75 ?? 66 0f 6e ?? ?? f3 0f 10 8f b8 02 00 00 f3 0f 59 0d ?? ?? ?? ?? 0f 5b c0 f3 0f 59 c8 f3 ?? 0f';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription");

        const quartzDescriptionAddress = this.context.rdx;
        let quartzDescription = quartzDescriptionAddress.readUtf8String();

        if (!quartzDescription.startsWith("#36s#0C")) // It would extract a lot more otherwise
            return;

        if (quartzDescription !== previousQuartzDescription) {
            previousQuartzDescription = quartzDescription;
            quartzDescription = quartzDescription.replace(/#\d+[a-zA-Z]/g, '');
            previousMasterQuartzDescription = '';

            secondHandler(quartzDescription);
        }


    });
})();


let previousBattleDescription = '';
(function () { // Items, crafts, arts, brave orders
    const battleDescriptionSig = 'e8 ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b c8 8d 57 4f';
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

        const battleDescriptionAddress = this.context.r9;
        let battleDescription = battleDescriptionAddress.readUtf8String();

        if (battleDescription !== previousBattleDescription) {
            previousBattleDescription = battleDescription;
            battleDescription = battleDescription.replace(/#\d+[a-zA-Z]/g, '');

            secondHandler(battleDescription);
        }
    });
})();


let previousLocationName = '';
(function () { 
    const locationNameSig = 'e8 ?? ?? ?? ?? eb ?? ?? 8b 8d 50 ae';
    var results = Memory.scanSync(__e.base, __e.size, locationNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[locationNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[locationNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: locationName");

        const locationNameAddress = this.context.rdx;
        let locationName = locationNameAddress.readUtf8String();

        if (locationName == previousLocationName) 
            return;

        previousLocationName = locationName;
        secondHandler(locationName);
        
        setTimeout(() => {
            previousLocationName = '';
        }, 30000);
    });
})();


(function () {
    const bookSig = 'e8 ?? ?? ?? ?? ?? 8b d8 ?? 89 44 ?? ?? 8b 97';
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

        const bookAddress = this.context.rbx;
        let book = bookAddress.readUtf8String();
        book = cleanText(book);

        secondHandler(book);
    });
})();


let characterNoteTitle = '';
(function () {
    const characterNoteTitleSig = 'e8 ?? ?? ?? ?? f3 0f 10 05 ?? ?? ?? ?? f3 ?? 0f 58 dc';
    var results = Memory.scanSync(__e.base, __e.size, characterNoteTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNoteTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNoteTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNoteTitle");

        const characterNoteTitleAddress = this.context.r9;
        characterNoteTitle = characterNoteTitleAddress.readUtf8String();
        characterNoteTitle = characterNoteTitle.replace(/#\d{1,3}[a-zA-Z]/g, '');
    });
})();


let previousCharacterNote1 = '';
(function () {
    const characterNote1Sig = 'e8 ?? ?? ?? ?? ?? 0f b7 ab c4 02';
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

        const characterNote1Address = this.context.r9;
        let characterNote1 = characterNote1Address.readUtf8String();
        // characterNote1 = cleanText(characterNote1);

        if (characterNote1 !== previousCharacterNote1) {
            // To extract the additional character details again if the next one viewed doesn't have any unlocked and then back to the same character
            characterDetailsSet.clear();
            previousCharacterNote2 = '';

            previousCharacterNote1 = characterNote1;
            mainHandler(characterNoteTitle + "\n" + characterNote1);
        }
    });
})();


let previousCharacterNote2 = '';
let currentCharacterNote = '';
let characterDetailsSet = new Set();
(function () {
    const characterNote2Sig = 'e8 ?? ?? ?? ?? ?? 0f 28 de f3 0f 10';
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

        const characterNote2Address = this.context.r9;
        let characterNote2 = characterNote2Address.readUtf8String();

        if (characterNote2 !== previousCharacterNote2 && !characterDetailsSet.has(characterNote2)) {
            previousCharacterNote2 = characterNote2;
            characterDetailsSet.add(characterNote2);
            mainHandler("\n" + characterNote2);
        }
    });
})();


(function () {
    const questNoteSig = 'e8 ?? ?? ?? ?? 66 ff c3 0f b7 c3 ?? 3b';
    var results = Memory.scanSync(__e.base, __e.size, questNoteSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[questNotePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[questNotePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: questNote");

        const questNoteAddress = this.context.rdx;
        let questNote = questNoteAddress.readUtf8String();
        questNote = questNote.replace(/#\d{1,3}[a-zA-Z]/g, '');

        mainHandler(questNote);

    });
})();


const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
function readString(address) {
    let character = '';
    let sentence = "";

    while (character = address.readU8()) {
        if (character < 0x80 && address.add(1).readU8() === 0x01) { // Sometimes a random character would be extracted instead of the item name when obtaining something
            address = address.add(1);
            continue;
        }

        if (character >= 0x20) {
            character = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
            sentence += character;
            address = address.add(encoder.encode(character).byteLength);
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
                    address = address.add(1);
                    sentence += "\n\n";
                    continue;

                case 0x04: // Item logo?
                case 0x06: // Item logo?
                case 0x07: // Item logo?
                case 0x08:
                case 0x0b: // Green text
                case 0x0c:
                    address = address.add(1);
                    continue;

                case 0x0e: // Item reference?
                    address = address.add(3);
                    continue;

                case 0x10: // Red text
                    address = address.add(1);
                    continue;

                case 0x11:
                    address = address.add(5);
                    continue;

                case 0x18:
                case 0x19:
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
        .replace(/#[0-9]+R[^#]+#/g, '') // Furigana
        .replace(/#[a-zA-Z0-9]+/g, '')
        .replace(/\[[a-zA-Z0-9]+\]/g, '')
        .replace(/\[[a-zA-Z0-9]+\]/g, '') // Redundant but there can be nested brackets
        .replace(/[a-zA-Z0-9]?_[a-zA-Z0-9]+/g, '')
        .replace(/#[a-zA-Z]_[0-9]+/g, '')
        .replace(/#-[a-zA-Z0-9]+/g, '')
        .replace(/�/g, '')
        .replace(/\\n/g, '\n');
}