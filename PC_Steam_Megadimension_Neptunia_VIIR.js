// ==UserScript==
// @name         Megadimension Neptunia VIIR
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Idea Factory, Compile Heart
// * publisher   Idea Factory, Compile Heart
//
// https://store.steampowered.com/app/774511/Megadimension_Neptunia_VIIR/
// ==/UserScript==


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);
const secondHandler = trans.send(s => s, '200+\n\n+');


let name = "";
(function () {
    const nameSig = '80 3c 01 00 75 ?? ?? 85 c0 74 ?? e8';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[NamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[NamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rcx;
        name = nameAddress.readUtf8String();

    });
})();


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? 33 c0 ?? 8d 0d ?? ?? ?? ?? ?? 8d 05 ?? ?? ?? ?? ?? 8d 4f 08 ba 00 08 00 00 ?? 89 07 e8';
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
        let text = dialogueAddress.readUtf8String();

        if (name !== '') {
            mainHandler(name + "\n" + text);
            name = '';
        }

        else
            mainHandler(text);
    });
})();


let tutorialFull = [];
let tutorialTimer = null;
(function () {
    const tutorialSig = '80 3a 00 74 ?? ff c0 ?? 83 c1 10 83 f8 06 72 ?? c3';
    var results = Memory.scanSync(__e.base, __e.size, tutorialSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorialPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorialPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();

        tutorial = cleanText(tutorial);

        if (tutorialFull.includes(tutorial))
            return;

        tutorialFull.push(tutorial);

        secondHandler(tutorial);

        if (tutorialTimer)
            clearTimeout(tutorialTimer);

        tutorialTimer = setTimeout(() => {
            tutorialTimer = [];
        }, 500);
    });
})();


(function () {
    const popUpSig = 'e8 ?? ?? ?? ?? ?? 83 bb 10 04 00 00 00 75 ?? 80';
    var results = Memory.scanSync(__e.base, __e.size, popUpSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[popUpPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[popUpPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: popUp");

        const popUpAddress = this.context.rdx;
        let popUp = popUpAddress.readUtf8String();

        popUp = cleanText(popUp);

        mainHandler(popUp);
    });
})();


(function () {
    const inventoryDescriptionSig = '80 38 00 74 ?? c6 43 02 01 c7 43 10 01';
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

        const inventoryDescriptionAddress = this.context.rax;
        let inventoryDescription = inventoryDescriptionAddress.readUtf8String();

        mainHandler(inventoryDescription);
    });
})();


(function () {
    const skillDescriptionSig = '74 10 ?? 38 11 74 0b c6 43 02 01';
    var results = Memory.scanSync(__e.base, __e.size, skillDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[skillDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[skillDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: skillDescription");

        const skillDescriptionAddress = this.context.rcx;
        let skillDescription = skillDescriptionAddress.readUtf8String();

        mainHandler(skillDescription);
    });
})();


(function () {
    const challengeSig = 'e8 ?? ?? ?? ?? ?? 83 bb 38 0c';
    var results = Memory.scanSync(__e.base, __e.size, challengeSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[challengePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[challengePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: challenge");

        const challengeAddress = this.context.rdx;
        let challenge = challengeAddress.readUtf8String();
        challenge = readString(challengeAddress);

        challenge = cleanText(challenge);

        mainHandler(challenge);
    });
})();


(function () {
    const characterDescriptionSig = 'e8 6a 28 1d 00 ?? 8b bc';
    var results = Memory.scanSync(__e.base, __e.size, characterDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterDescription");

        const characterDescriptionAddress = this.context.rdx;
        let characterDescription = characterDescriptionAddress.readUtf8String();
        characterDescription = readString(characterDescriptionAddress);

        characterDescription = cleanText(characterDescription);

        if (characterDescription.length < 40) // To prevent junk extraction mid-battle
            return;

        mainHandler(characterDescription);
    });
})();


(function () {
    const neppediaSig = 'e8 ?? ?? ?? ?? ?? 83 7b 18 00 75 ?? ?? 8d ?? ?? 20 e8 ?? ?? ?? ?? 8b 44 ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, neppediaSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[neppediaPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[neppediaPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: neppedia");

        const neppediaAddress = this.context.rdx;
        let neppedia = neppediaAddress.readUtf8String();
        neppedia = readString(neppediaAddress);

        neppedia = cleanText(neppedia);

        mainHandler(neppedia);
    });
})();


(function () {
    const configSig = 'e8 90 d3 34 00 ?? 83 3b 00 74 1b';
    var results = Memory.scanSync(__e.base, __e.size, configSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[configPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[configPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: config");

        const configAddress = this.context.rax;
        let config = configAddress.readUtf8String();

        mainHandler(config);
    });
})();


function cleanText(text) {
    return text
        .replace(/#[A-Za-z]+\[.*?\]/g, ' ')
        .replace(/%s/g, ' ')
        .replace(/#n/g, "\n")
        .trim();
}


const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
function readString(address) {
    let s = '', c;
    let nullCount = 0;

    while (nullCount < 2) { // Read the name, then the description
        while ((c = address.readU8()) !== 0x00) {
            c = decoder.decode(address.readByteArray(4))[0];
            s += c;
            address = address.add(encoder.encode(c).byteLength);
        }

        if (s === "？？？")
            return s;

        nullCount++;

        if (nullCount === 1)
            s += "\n-----------------\n";

        address = address.add(1);
    }
    return s;
}