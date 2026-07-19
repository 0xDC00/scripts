// ==UserScript==
// @name         Tokyo Xanadu eX+ / 東亰ザナドゥ eX+
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   Aksys Games 
//
// https://store.steampowered.com/app/587260/Tokyo_Xanadu_eX/
// ==/UserScript==


console.warn("Known issues:\n- When a character has at least two textboxes worth of dialogue they will all be extracted at the same time.");
console.warn("- When you open the Niar menu a bunch of text might get extracted since everything gets loaded at the same time.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, 200);
const thirdHandler = trans.send(s => s, '25+');


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
        name = nameAddress.readUtf8String();
    });
})();


(function () { 
    const dialogueSig = 'e8 ?? ?? ?? ?? 83 c4 0c 83 bf c0 00 00 00 01 8b c8 89';
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
        let dialogue = readString(dialogueAddress);

        setTimeout(() => { // name hook called after dialogue
            mainHandler(name + "\n" + dialogue);
        }, 50);
    });
})();


(function () {
    const activeVoiceSig = 'e8 ?? ?? ?? ?? 8d 4f 04 c7 87 d4 05';
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

        const activeVoiceAddress = this.context.ebx.add(16).readPointer();
        let activeVoice = activeVoiceAddress.readUtf8String();
        activeVoice = cleanText(activeVoice);
        mainHandler(activeVoice);
    });
})();


(function () {
    const choices1Sig = 'ff 92 94 00 00 00 e9 ?? ?? ?? ?? 3c 02 0f 85 ?? ?? ?? ?? 8d 5e 01 3b f3 73 ?? 8b c3 2b c6 50 8d ?? f9';
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
        let choices = choicesAddress.readUtf8String();
        mainHandler(choices);
    });
})();


(function () { // Gachapon
    const choices2Sig = 'e8 ?? ?? ?? ?? 8b ?? ?? 89 ?? ?? 8b ?? ?? 89 ?? ?? 8b 87 6c 01';
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

        try {
            const choicesAddress = this.context.ebx;
            let choices = choicesAddress.readUtf8String();
            mainHandler(choices);
        }
        catch(e) { /* To remove the error when opening the equipment menu. */ }
    });
})();


(function () { // Mostly tutorial text boxes
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? 8b f8 8b ?? ?? 83 c4 0c 83 b8';
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

        const systemMessageAddress = this.context.esi;
        let systemMessage = readString(systemMessageAddress);
        systemMessage = cleanText(systemMessage);
        mainHandler(systemMessage);
    });
})();


let previousDescription = '';
(function () { // And inventory
    const statusDescriptionSig = '8b 4f 18 52 8d 89 b4 01 00 00 e8';
    var results = Memory.scanSync(__e.base, __e.size, statusDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[statusDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0xa);
    console.log('[statusDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: statusDescription");

        const statusDescriptionAddress = this.context.edx;
        let statusDescription = statusDescriptionAddress.readUtf8String();

        // console.warn(statusDescription);

        if(statusDescription === previousDescription)
            return;

        previousDescription = statusDescription;
        statusDescription = cleanText(statusDescription);
        secondHandler(statusDescription);
    });
})();


let currentItemDescription = '';
(function () { // Serves as some sort of bridge for the next few hooks to get the necessary text
    const itemDescriptionSig = '74 ?? 8b 1e 03 d8 8b ?? ?? ?? ?? ?? c6';
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

        try {
        const itemDescriptionAddress = this.context.ebx;
        currentItemDescription = itemDescriptionAddress.readUtf8String();
        currentItemDescription = cleanText(currentItemDescription);
        }
        catch(e) { /* To remove the error when loading a save */ }
    });
})();


(function () {
    const equipmentDescriptionSig = 'e8 ?? ?? ?? ?? 8b 47 28 8b 88 a4 01';
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

        if(currentItemDescription === previousDescription) // Hook is called every frame
            return;

        previousDescription = currentItemDescription;
        secondHandler(currentItemDescription);
    });
})();


(function () {
    const shopItemDescriptionSig = 'e8 ?? ?? ?? ?? f3 0f 10 05 ?? ?? ?? ?? f3 0f 5c ?? ?? ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, shopItemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[shopItemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[shopItemDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: shopItemDescription");

        if(currentItemDescription === previousDescription) // Hook is called every frame
            return;

        previousDescription = currentItemDescription;
        secondHandler(currentItemDescription);
    });
})();


(function () { 
    const niarMainSig = 'e8 ?? ?? ?? ?? 43 0f b7 fb 3b';
    var results = Memory.scanSync(__e.base, __e.size, niarMainSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[niarMainPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[niarMainPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: niarMain");

        const niarMainAddress = this.context.eax;
        let niarMain = niarMainAddress.readUtf8String();
        niarMain = cleanText(niarMain);
        thirdHandler(niarMain);
    });
})();


(function () { 
    const niarBookSig = 'e8 ?? ?? ?? ?? 8b 86 28 02 00 00 c7';
    var results = Memory.scanSync(__e.base, __e.size, niarBookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[niarBookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[niarBookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: niarBook");

        const niarBookAddress = this.context.eax;
        let niarBook = niarBookAddress.readUtf8String();
        niarBook = cleanText(niarBook);
        thirdHandler(niarBook);
    });
})();


let characterDetailsSet = new Set(); 
let previousCharacter = '';
let previousNiarFriendName = '';
(function () { 
    const niarFriendNameSig = '83 e1 01 2b c1 68 ff 00 00 00 50 8d ?? e0';
    var results = Memory.scanSync(__e.base, __e.size, niarFriendNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[niarFriendNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[niarFriendNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: niarFriendName");

        const niarFriendNameAddress = this.context.eax;
        let niarFriendName = niarFriendNameAddress.readUtf8String();

        if(niarFriendName !== previousNiarFriendName) {
            characterDetailsSet.clear();
            previousCharacter = '';
            previousNiarFriendName = niarFriendName;
        }
    });
})();


let currentCharacter = '';
(function () { 
    const niarFriendDescriptionSig = 'ff 15 ?? ?? ?? ?? 83 c4 18 6a';
    var results = Memory.scanSync(__e.base, __e.size, niarFriendDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[niarFriendDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[niarFriendDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: niarFriendDescription");

        const niarFrienTitledAddress = this.context.eax;
        let niarFriendTitle = niarFrienTitledAddress.readUtf8String();
        niarFriendTitle = cleanText(niarFriendTitle);

        const niarFrienDescriptionAddress = this.context.esp.add(8).readPointer();
        let niarFriendDescription = niarFrienDescriptionAddress.readUtf8String();

        if (niarFriendDescription !== previousCharacter && !characterDetailsSet.has(niarFriendDescription)) {
            previousCharacter = niarFriendDescription;
            characterDetailsSet.add(niarFriendDescription);
            thirdHandler(niarFriendTitle + '\n' + niarFriendDescription + '\n');
        }
    });
})();


(function () { // Difficulty and extra
    const titleScreenDescriptionSig = 'e8 ?? ?? ?? ?? 5f 5e 5b 8b e5 5d c3 cc cc cc cc cc cc 56 8b f1';
    var results = Memory.scanSync(__e.base, __e.size, titleScreenDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[titleScreenDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[titleScreenDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: titleScreenDescription");

        const titleScreenDescriptionAddress = this.context.edi;
        let titleScreenDescription = titleScreenDescriptionAddress.readUtf8String();

        if(titleScreenDescription === previousDescription)
            return;

        previousDescription = titleScreenDescription;
        titleScreenDescription = cleanText(titleScreenDescription);
        secondHandler(titleScreenDescription);
    });
})();


(function () { // Title screen option menu
    const optionDescription1Sig = 'e8 ?? ?? ?? ?? c7 ?? ?? ff ff ff ff eb ?? 68 ?? ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, optionDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[optionDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[optionDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: optionDescription1");

        const optionDescriptionAddress = this.context.eax;
        let optionDescription = optionDescriptionAddress.readUtf8String();

        if(optionDescription === previousDescription)
            return;

        previousDescription = optionDescription;
        optionDescription = cleanText(optionDescription);
        secondHandler(optionDescription);
    });
})();


(function () { // main menu option menu, and menu description
    const optionDescription2Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 8d 89 b4 01 00 00 68';
    var results = Memory.scanSync(__e.base, __e.size, optionDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[optionDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[optionDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: optionDescription2");

        const optionDescriptionAddress = this.context.eax;
        let optionDescription = optionDescriptionAddress.readUtf8String();

        if(optionDescription === previousDescription)
            return;

        previousDescription = optionDescription;
        optionDescription = cleanText(optionDescription);
        secondHandler(optionDescription);
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

                case 0xa:
                    address = address.add(1);
                    return;

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
        .replace(/#[0-9]+R[^#]*#/g, '') // furigana
        .replace(/#[A-Za-z](?:_[A-Za-z0-9]+|\[[A-Za-z0-9]+\])?/g, '') // tags
        .replace(/#[A-Za-z0-9]+/g, '') // more tags
        .replace(/�/g, '')
        .replace(/\\n/g, '\n');
}