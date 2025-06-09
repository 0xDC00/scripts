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


console.warn("Known issues:\n- There are extra text extractions during battles.");
console.warn("- When a character has at least two identical textboxes worth of dialogue they will all be extracted at the same time, and it's possible there'll be one or two random characters before the text.");
console.warn("- When opening a book or turning a page the game will freeze/lag for about a second.");
console.warn("- When opening the student handbook a note you might not have seen yet will be extracted.");
console.warn("Furthermore, when viewing quest notes the top one won't get extracted before you view a different one from the same list. So if there's only one it won't get extracted.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, -200);
const secondHandler = trans.send((s) => s, '200+');
const otherHandler = trans.send((s) => s, 200);


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
            readString(dialogueAddress);
        }, 200);
        name = '';
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

                otherHandler(menuDescription);
            }

            else if (inventoryDescription !== previousInventoryDescription) {
                previousInventoryDescription = inventoryDescription;
                inventoryDescription = inventoryDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

                otherHandler(inventoryDescription);
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
            artsDescription = cleanText(artsDescription);

            otherHandler(artsDescription);
        }
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
            quartzDescription1 = cleanText(quartzDescription1);

            otherHandler(quartzDescription1);
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
            quartzDescription2 = cleanText(quartzDescription2);

            otherHandler(quartzDescription2);
        }
    });
})();


let previousEquipmentDescription1 = '';
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

        if (equipmentDescription1 !== previousEquipmentDescription1) {
            previousEquipmentDescription1 = equipmentDescription1;
            equipmentDescription1 = cleanText(equipmentDescription1);

            otherHandler(equipmentDescription1);
        }
    });
})();


let previousEquipmentDescription2 = '';
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

        if (equipmentDescription2 !== previousEquipmentDescription2) {
            previousEquipmentDescription2 = equipmentDescription2;
            equipmentDescription2 = cleanText(equipmentDescription2);

            otherHandler(equipmentDescription2);
        }
    });
})();


let previousBattleDescription = '';
(function () { // Descriptions of items, crafts and arts
    const battleDescriptionSig = 'e8 ?? ?? ?? ?? 0f b7 4f 14 66 89';
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

        const battleDescriptionAddress = this.context.eax;
        let battleDescription = battleDescriptionAddress.readShiftJisString();

        if (battleDescription !== previousBattleDescription) {
            previousBattleDescription = battleDescription;
            battleDescription = battleDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            mainHandler(battleDescription);
        }
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

        secondHandler(quest);
    });
})();


let previousCharacterNote = '';
(function () {
    const characterNoteSig = 'e8 ?? ?? ?? ?? d9 ?? ?? dc 25 ?? ?? ?? ?? bf';
    var results = Memory.scanSync(__e.base, __e.size, characterNoteSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNotePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNotePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNote");

        const characterNoteAddress = this.context.esp.add(8).readPointer();
        let characterNote = characterNoteAddress.readShiftJisString();

        if (characterNote !== previousCharacterNote) {
            previousCharacterNote = characterNote;
            secondHandler(characterNote);
        }
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

            otherHandler(shopItemDescription);
        }
    });
})();


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

        const bookAddress = this.context.edx;
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

        if (name !== '') {
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
        .replace(/#\d{3}[a-zA-Z]/g, '')
        .replace(/#.*?#/g, '')
        .replace(/[a-z]\d[A-Z]#/g, '')         // Remove things like y0T#
        .replace(/[a-z]?[A-Z]\[\d+\]/g, '')    // Remove things like M[9], vM[0]
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