// ==UserScript==
// @name         SENRAN KAGURA Reflexions
// @version      1.01
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Tamsoft
// * publisher   Marvelous
//
// https://store.steampowered.com/app/981770/SENRAN_KAGURA_Reflexions/
// ==/UserScript==


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);
const secondHandler = trans.send(s => s, '200+\n\n+');


let isExtracted = false;
(function () {
    const nameSig = 'ff 90 80 00 00 00 ?? 8d ?? 50 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[namePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[namePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: name");

        const textAddress = this.context.rdx;
        let name = textAddress.readUtf8String();

        // mainHandler(name);
        if (isExtracted)
            return;

        mainHandler(name + "\n" + dialogue);

        isExtracted = true;
    })
})();


let dialogue = '';
(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? 83 8b c8 00 00 00';
    var results = Memory.scanSync(__e.base, __e.size, dialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[dialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[dialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: dialogue");

        const textAddress = this.context.rdx;
        dialogue = textAddress.readUtf8String();

        isExtracted = false;
    })
})();


(function () { // Right of the screen
    const subsSig = 'e8 ?? ?? ?? ?? ?? 8d 8b b0 7a 00 00';
    var results = Memory.scanSync(__e.base, __e.size, subsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[subsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[subsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: subs");

        const textAddress = this.context.rdx;
        let subs = textAddress.readUtf8String();

        mainHandler(subs);
    })
})();


(function () {
    const menuDescriptionSig = 'ff 15 ?? ?? ?? ?? ?? 8b cb ?? 83';
    var results = Memory.scanSync(__e.base, __e.size, menuDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: menuDescription");

        const textAddress = this.context.rdx;
        let menuDescription = textAddress.readUtf8String();

        mainHandler(menuDescription);
    })
})();


(function () {
    const confirmationPromptSig = 'e8 ?? ?? ?? ?? 80 bb 80 3b 00 00 00 74';
    var results = Memory.scanSync(__e.base, __e.size, confirmationPromptSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[confirmationPromptPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[confirmationPromptPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: confirmationPrompt");

        const textAddress = this.context.rdx;
        let confirmationPrompt = textAddress.readUtf8String();

        mainHandler(confirmationPrompt);
    })
})();


(function () {
    const tutorial1Sig = '80 3a 00 75 ?? ?? 33 c9 eb';
    var results = Memory.scanSync(__e.base, __e.size, tutorial1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: tutorial1");

        const textAddress = this.context.rdx;
        let tutorial1 = textAddress.readUtf8String();

        tutorial1 = cleanText(tutorial1);

        secondHandler(tutorial1);
    })
})();


(function () {
    const tutorial2Sig = 'c6 ?? ?? 00 80 3a 00 75 ?? ?? 8b c7 eb';
    var results = Memory.scanSync(__e.base, __e.size, tutorial2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorial2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorial2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: tutorial2");

        const textAddress = this.context.rdx;
        let tutorial2 = textAddress.readUtf8String();

        mainHandler(tutorial2);
    })
})();



function cleanText(text) {
    return text
        .replace(/\\n/g, "\n")
        .replace(/\[[^>]*\]/g, '')
        .replace(/\[[□▽◇]\]/g, "")
        .replace(/\p{No}/gu, " ")
        .trim();
}