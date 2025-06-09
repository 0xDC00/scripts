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


console.warn("Known issues:\n- There are extra text extractions during battles, crafts and arts will only have half of the descriptions extracted.");
console.warn("- When a character has at least two identical textboxes worth of dialogue they will all be extracted at the same time, and it's possible there'll be one or two random characters before the text.");
console.warn("- When opening a book or turning a page the game will freeze/lag for about a second.");
console.warn("- When opening the student handbook a book page will be extracted, causing the aforementioned lag.");
console.warn("- When selecting the main notes tab the already selected note won't get extracted before you view a different one from the same list. So if there's only one it won't get extracted.");
console.warn("- Depending on how early you attach the script there might be an item's description extracted. The same might happen during some loading times.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, -200);
const secondHandler = trans.send((s) => s, '200+');
const otherHandler = trans.send((s) => s, 200);


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
        name = cleanText(name);
    });
})();


(function () {
    const dialogueSig = '8a 07 3c 20 73 ?? 0f';
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

        const dialogueAddress = this.context.edi;
        let text = dialogueAddress.readShiftJisString();
        // console.warn(hexdump(dialogueAddress, { header: false, ansi: false, length: 0x50 }));

        // Dialogue hook is called before the name hook
        setTimeout(() => {
            readString(dialogueAddress, "dialogue");
        }, 200);
        name = '';
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
    const choicesSig = 'ff 52 7c e9 ?? ?? ?? ?? 3c 02 0f 85 ?? ?? ?? ?? 8d 5e 01 3b f3 73 ?? 8b c3 2b c6 50 8d ?? f9';
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
(function () {
    const menuDescriptionSig = '8b cb e8 ?? ?? ?? ?? 8b ?? ?? 64 89 0d ?? ?? ?? ?? 59 5f 5e 5b 8b ?? ?? 33';
    var results = Memory.scanSync(__e.base, __e.size, menuDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(2);
    console.log('[menuDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription");

        const menuDescriptionAddress = this.context.eax;

        try {
            let menuDescription = menuDescriptionAddress.readShiftJisString();
            menuDescription = cleanText(menuDescription);

            if (menuDescription !== previousMenusDescription && menuDescription.length >= 5) {
                previousMenusDescription = menuDescription;


                otherHandler(menuDescription);
            }
        }
        catch (e) { }
    });
})();


let previousEquipmentDescription = '';
(function () { // Also quartz and item descriptions
    const equipmentDescriptionSig = '50 e8 ?? ?? ?? ?? 8b ?? ?? 64 89 0d ?? ?? ?? ?? 59 5f 5e 5b 8b ?? ?? 33 cd e8 ?? ?? ?? ?? 8b e5 5d c2 08 00';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(1);
    console.log('[equipmentDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription");

        const equipmentDescriptionAddress = this.context.eax;
        let equipmentDescription = equipmentDescriptionAddress.readShiftJisString();

        if (equipmentDescription !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription;
            equipmentDescription = equipmentDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            otherHandler(equipmentDescription);
        }
    });
})();


(function () { // Descriptions of crafts and arts (only half)
    const battleDescriptionSig = '8a 01 41 84 c0 75 ?? 2b ca 6a 02 8d 41 01 50 89 ?? ?? e8 ?? ?? ?? ?? 8b d8 83 c4 08 85 db 74 ?? ff ?? ?? ff ?? ?? 53 e8 ?? ?? ?? ?? 83 c4 0c 85 db 74 ?? 8d 4e 14';
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

        const battleDescriptionAddress = this.context.ecx;
        let battleDescription = battleDescriptionAddress.readShiftJisString();
        readString(battleDescriptionAddress, "battle");
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
        let book = bookAddress.readShiftJisString();
        book = cleanText(book);

        secondHandler(book);
    });
})();


const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');
let previous = '';
function readString(address, hookName) {
    let character = '';
    let sentence = "";
    const buffer = new Uint8Array(2);

    if (address.readU8() <= 0x80)
        return; // Not Shift_JIS


    while (character = address.readU8()) {
        buffer[0] = character;
        buffer[1] = address.add(1).readU8();
        character = decoder.decode(buffer)[0]; // ShiftJIS: 1->2 bytes.
        sentence += character;
        address = address.add(encoder.encode(character).byteLength);

        switch (character.charCodeAt(0)) {
            case 0x00:
                if (address.add(2).readU8() === 0x23)
                    address = address.add(2);
                continue;

            case 0x01: // New line
                sentence += "\n";
                continue;

            // case 0x02: // Next bubble
            case 0x03: // End of bubble
                sentence += "\n\n";
                continue;

            case 0x11:
                address = address.add(4);
                continue;
        }

        if (address.add(1).readU8() === 0x00 && address.add(3).readU8() === 0x23)
            address = address.add(3);
    }

    if (!previous.includes(sentence)) {
        sentence = cleanText(sentence);

        if (name !== '' && hookName === 'dialogue') {
            // console.warn(hexdump(address, { header: false, ansi: false, length: 0x50 }));
            previous = sentence;
            mainHandler(name + "\n" + sentence);
        }

        else
            mainHandler(sentence);
    }
}


function cleanText(text) {
    return text
        // There probably are a few that are now useless but I'm too lazy to test them out individually
        .replace(/\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2}/g, '') // Date and time
        .replace(/#\d{3}[a-zA-Z]/g, '')
        .replace(/#.*?#/g, '')
        .replace(/\b[a-zA-Z0-9]_[a-zA-Z0-9]\b/g, '')
        .replace(/[a-z]\d[A-Z]#/g, '')         // Remove things like y0T#
        .replace(/[a-z]?[A-Z]\[[a-zA-Z0-9]\]/g, '')    // Remove things like M[9], vM[0]
        .replace(/[a-z]?[A-Z]\d+/g, '')        // Remove things like M0, bM0
        .replace(/[a-z]\d\b/g, '')             // Remove things like z0
        .replace(/%\d+d/g, '')
        .replace(/^[a-zA-Z0-9]$/, '')
        .replace(/\b\d{3}y\b/g, '')
        .replace(/L_ｴ/g, '')
        .replace(/ｴ/g, '')
        .replace(/Iv@/g, '')
        .replace(/#\w+/g, '')
        .replace(/\[\d+\]/g, '')
        .replace(/[\uFF61-\uFF9F`㈱}#@�-]/g, '')
        .replace(/[ \t\f\v\u00A0\u2028\u2029]+/g, '') // Whitespace except new line
        .replace(/\\n/g, '\n');
}