// ==UserScript==
// @name         Sen no Kiseki IV / Trails of Cold Steel IV 
// @version      1.2.1
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   XSEED Games
//
// https://store.steampowered.com/app/1198090/The_Legend_of_Heroes_Trails_of_Cold_Steel_IV/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_of_cold_steel_iv
// ==/UserScript==


console.warn("Known issues:\n- Sometimes a character will have more than one line of dialogue extracted at once.");
console.warn("- Art, craft, order, etc. descriptions from the battle menu will only have half extracted.");
console.warn("- When opening the handbook or the 'help' section from the system menu a random extraction might occur.");
console.warn("- If you attach the script before the title screen appears there will be a long random extraction.");
console.warn("- It's possible there might a be a random two or three character junk extraction sometimes (might be related to turbo?).");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);


let name = '';
(function () {
    const nameSig = 'e8 ?? ?? ?? ?? 8b c6 ?? 8d 8f 80';
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

        const nameAddress = this.context.r8;
        name = nameAddress.readUtf8String();
    });
})();


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? eb ?? ?? 8d 05 ?? ?? ?? ?? ba 00 04 00 00 ?? 8d 4c ?? 40 e8';
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

        const dialogueAddress = this.context.r8;

        let dialogue = readString(dialogueAddress);

        // Name hook is called after dialogue hook
        setTimeout(() => {
            if (name === '')
                mainHandler(dialogue);
            else
                mainHandler(name + '\n' + dialogue);
        }, 200);

        name = '';

        // console.warn(hexdump(dialogueAddress, { header: false, ansi: false, length: 0x100 }));
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
    const choicesSig = '38 1c 06 75 ?? ?? 8d 56 01 b9 04 00 00 00 ?? 83';
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

        const choicesAddress = this.context.rsi;
        let choices = choicesAddress.readUtf8String();
        mainHandler(choices);
    });
})();


(function () {
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? ?? 8b 6c ?? 58 2b';
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
    const menuDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 8e b8 00 00 00 e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, menuDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription");

        const menuDescriptionAddress = this.context.rdx;
        let menuDescription = menuDescriptionAddress.readUtf8String();

        if (menuDescription !== previousMenusDescription) {
            previousMenusDescription = menuDescription;
            secondHandler(menuDescription);
        }
    });
})();


let previousLinkDescription = '';
(function () {
    const linkDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 be 80 00';
    var results = Memory.scanSync(__e.base, __e.size, linkDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[linkDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[linkDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: linkDescription");

        const linkDescriptionAddress = this.context.rdx;
        let linkDescription = linkDescriptionAddress.readUtf8String();

        if (linkDescription !== previousLinkDescription) {
            previousLinkDescription = linkDescription;
            secondHandler(linkDescription);

            // To allow extraction again after 30 seconds, early game when the player only has one link ability
            setTimeout(() => {
                previousLinkDescription = '';
            }, 30000);
        }
    });
})();


let previousEquipmentDescription = '';
(function () {
    const equipmentDescriptionSig = 'e8 ?? ?? ?? ?? 8b f8 85 c0 79 ?? ?? 8d';
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

        try {
            const equipmentDescriptionAddress = this.context.r14.add(64).readPointer();
            let equipmentDescription = equipmentDescriptionAddress.readUtf8String();
            equipmentDescription = equipmentDescription.replace(/\d{1,3}(:\d{2}){1,2}\b/g, '');

            if (equipmentDescription.length < 5 || equipmentDescription === battleDescription || equipmentDescription.includes('/'))
                return;

            if (equipmentDescription !== previousEquipmentDescription && equipmentDescription !== null) {
                previousEquipmentDescription = equipmentDescription;
                secondHandler(equipmentDescription);
            }
        }
        catch (e) { }
    });
})();


let previousOrbmentMenu = '';
(function () {
    const orbmentMenuSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ba 28 01 00 00 eb';
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
    const masterQuartzDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 81 c4 98 0c 00 00';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzDescription");

        const masterQuartzDescriptionAddress = this.context.rdx;
        let masterQuartzDescription = masterQuartzDescriptionAddress.readUtf8String();
        masterQuartzDescription = masterQuartzDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

        if (masterQuartzDescription !== previousMasterQuartzDescription) {
            previousMasterQuartzDescription = masterQuartzDescription;
            secondHandler(masterQuartzDescription);
        }
    });
})();


let previousQuartzDescription = '';
(function () { // Also some items from inventory and craft descriptions
    const quartzDescriptionSig = 'e8 ?? ?? ?? ?? 0f b6 8f a8 02 00 00 85 c9 74 ?? 83 e9 01 74 ?? 83 f9 01 75 ?? 66 0f 6e ?? ?? 0f 5b c0 f3 0f 59 05 ?? ?? ?? ?? f3 ?? 0f';
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
            quartzDescription = cleanText(quartzDescription);

            secondHandler(quartzDescription);
        }
    });
})();


let battleDescription = '';
(function () { // Items, crafts, arts, brave orders
    const battleDescriptionSig = 'e8 ?? ?? ?? ?? 8b 47 20 89';
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

        const battleDescriptionAddress = this.context.rdx;
        battleDescription = battleDescriptionAddress.readUtf8String();

        if (battleDescription.length > 5)
            mainHandler(battleDescription);
    });
})();


(function () {
    const bookSig = 'e8 ?? ?? ?? ?? ?? 8b d8 ?? 89 44 ?? ?? 8b 87 d0 02';
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
    const characterNoteTitleSig = 'e8 ?? ?? ?? ?? f3 0f 10 05 ?? ?? ?? ?? f3 ?? 0f 58 f3 0f b6 46 40';
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
    const characterNote1Sig = 'e8 ?? ?? ?? ?? ?? 0f b7 af c4 02';
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

        if (characterNote1 !== previousCharacterNote1) {
            previousCharacterNote1 = characterNote1;
            mainHandler(characterNoteTitle + "\n" + characterNote1);
        }
    });
})();


// let previousCharacterNote2 = '';
// (function () {
//     const characterNote2Sig = 'e8 ?? ?? ?? ?? f3 0f 10 ?? ?? f3 0f 10 0d ?? ?? ?? ?? f3 ?? 0f 10';
//     var results = Memory.scanSync(__e.base, __e.size, characterNote2Sig);
//     // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

//     if (results.length === 0) {
//         console.error('[characterNote2Pattern] Hook not found!');
//         return;
//     }

//     const address = results[0].address;
//     console.log('[characterNote2Pattern] Found hook', address);
//     Interceptor.attach(address, function (args) {
//         // console.warn("in: characterNote2");

//         const characterNote2Address = this.context.r9;
//         let characterNote2 = characterNote2Address.readUtf8String();
//         // characterNote2 = cleanText(characterNote2);

//         if (characterNote2 !== previousCharacterNote2) {
//             previousCharacterNote2 = characterNote2;
//             mainHandler("\n" + characterNote2);
//         }
//     });
// })();


(function () {
    const questNoteSig = 'e8 ?? ?? ?? ?? 66 ff c3 0f';
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
let previous = '';
function readString(address, hookName) {
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
                case 0x07: // Red text?
                case 0x08:
                case 0x0b: // Green text
                case 0x0c:
                case 0x0e:
                case 0x10: // Item name?
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