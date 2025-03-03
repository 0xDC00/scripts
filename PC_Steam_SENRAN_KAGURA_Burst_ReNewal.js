// ==UserScript==
// @name         SENRAN KAGURA Burst Re:Newal
// @version      1.06
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Tamsoft
// * publisher   Marvelous
//
// https://store.steampowered.com/app/889510/SENRAN_KAGURA_Burst_ReNewal/
// ==/UserScript==


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);


(function () {
    const dialogueSig = 'ff 93 70 04 00 00';
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

        const nameAddress = this.context.rdi;
        let name = nameAddress.readUtf8String();

        const textAddress = this.context.rdx;
        let text = textAddress.readUtf8String();

        if (name === null)
            mainHandler(text);

        mainHandler(name + "\n" + text);
    })
})();


(function () {
    const narrationSig = 'e8 ?? ?? ?? ?? 8b 86 28 1e';
    var results = Memory.scanSync(__e.base, __e.size, narrationSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[narrationPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[narrationPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: narration");

        const narrationAddress = this.context.rbp;
        let narration = narrationAddress.readUtf8String();

        narration = cleanText(narration);

        mainHandler(narration);
    })
})();


let menuDescription = '';
(function () {
    const menuDescriptionSig = '53 ?? 83 ec 20 ?? 8b 59 50 ?? 8b ca';
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

        const menuDescriptionAddress = this.context.rdx;
        menuDescription = menuDescriptionAddress.readUtf8String();

        mainHandler(menuDescription);
    })
})();


let currentSelectChapterName = '';
(function () {
    const selectChapterNameSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 40 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? 33 c9 e8 ?? ?? ?? ?? ?? 8b 15';
    var results = Memory.scanSync(__e.base, __e.size, selectChapterNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[selectChapterNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[selectChapterNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: selectChapterName");

        const selectChapterNameAddress = this.context.rdx;
        let selectChapterName = selectChapterNameAddress.readUtf8String();

        if (currentSelectChapterName === selectChapterName)
            return;

        currentSelectChapterName = selectChapterName;

        mainHandler(selectChapterName);
    })
})();


// Function for both the chapter selection and pause screens
let chapterClearCondition = '';
(function () {
    const selectChapterClearConditionSig = 'e8 ?? ?? ?? ?? 0f b7 4e 28 8b';
    var results = Memory.scanSync(__e.base, __e.size, selectChapterClearConditionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[selectChapterClearConditionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[selectChapterClearConditionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: selectChapterClearCondition");

        const selectChapterClearConditionAddress = this.context.rdx;
        chapterClearCondition = selectChapterClearConditionAddress.readUtf8String();
    })
})();


let currentSelectChapterDescription = '';
let timer = null;
(function () {
    const selectChapterDescriptionSig = 'ff9080000000??8d????40??8d0d????????e8??????????8b15??????????8b05??????????393d??????????c705????????01000000??c705????????01000000??893d????????74????883d??????????8bd3??891d????????f3';
    var results = Memory.scanSync(__e.base, __e.size, selectChapterDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[selectChapterDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[selectChapterDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: selectChapterDescription");

        const selectChapterDescriptionAddress = this.context.rdx;
        let selectChapterDescription = selectChapterDescriptionAddress.readUtf8String();

        if (currentSelectChapterDescription === selectChapterDescription) {
            // Timer to reset 'currentSelectChapterDescription' to make sure that the content gets extracted again if the player goes back from the chapter select screen
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentSelectChapterDescription = '';
            }, 500);
            return;
        }

        currentSelectChapterDescription = selectChapterDescription;

        mainHandler(currentSelectChapterName + "\n-------------------\n" + chapterClearCondition + "\n\n" + selectChapterDescription);
    })
})();


let pauseChapterName = '';
(function () {
    const pauseChapterNameSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 50 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 83 bb d0 06 00 00 00 74'
    var results = Memory.scanSync(__e.base, __e.size, pauseChapterNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[pauseChapterNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[pauseChapterNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: pauseChapterName");

        const pauseChapterNameAddress = this.context.rdx;
        pauseChapterName = pauseChapterNameAddress.readUtf8String();
    })
})();


let currentPauseChapterDescription = '';
(function () {
    const pauseChapterDescriptionSig = 'ff 90 80 00 00 00 ?? 8d 54 ?? 50 ?? 8d 0d e3 3f 50 00 e8 7e 30 dc ff ?? 83'
    var results = Memory.scanSync(__e.base, __e.size, pauseChapterDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[pauseChapterDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[pauseChapterDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: pauseChapterDescription");

        const pauseChapterDescriptionAddress = this.context.rdx;
        let pauseChapterDescription = pauseChapterDescriptionAddress.readUtf8String();

        if (currentPauseChapterDescription === pauseChapterDescription) {
            // Timer to reset 'currentPauseChapterDescription' to make sure that the content gets extracted again at each pause
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentPauseChapterDescription = '';
            }, 500);
            return;
        }

        currentPauseChapterDescription = pauseChapterDescription;

        mainHandler(pauseChapterName + "\n-------------------\n" + chapterClearCondition + "\n\n" + pauseChapterDescription);


    })
})();


let tutorialName = '';
(function () {
    const tutorialNameSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 50 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b 15 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 39 3d';
    var results = Memory.scanSync(__e.base, __e.size, tutorialNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorialNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorialNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: tutorialName");

        const tutorialNameAddress = this.context.rdx;
        tutorialName = tutorialNameAddress.readUtf8String();
    })
})();


let currentTutorial = '';
(function () {
    const tutorialSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 50 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b 15 ?? ?? ?? ?? ?? 83 3d';
    var results = Memory.scanSync(__e.base, __e.size, tutorialSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tutorialPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tutorialPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: tutorial");

        const tutorialAddress = this.context.rdx;
        let tutorial = tutorialAddress.readUtf8String();

        if (currentTutorial === tutorial)
            return;

        currentTutorial = tutorial;

        tutorial = cleanText(tutorial);

        mainHandler(tutorialName + "\n-------------------\n" + tutorial);
    })
})();


(function () {
    const confirmationPromptSig = 'e8 ?? ?? ?? ?? f3 0f 10 0d ?? ?? ?? ?? f3 0f 10 44';
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

        const confirmationPromptAddress = this.context.rbx;
        let confirmationPrompt = confirmationPromptAddress.readUtf8String();

        mainHandler(confirmationPrompt);
    })
})();


let subsName = '';
(function () {
    const subsNameSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 40 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b 0d ?? ?? ?? ?? ?? 83 bb 10 05'
    var results = Memory.scanSync(__e.base, __e.size, subsNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[subsNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[subsNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: subsName");

        const subsNameAddress = this.context.rdx;
        subsName = subsNameAddress.readUtf8String();
    })
})();


let currentSub = '';
(function () {
    const subsDescriptionSig = 'ff 90 80 00 00 00 ?? 8d 54 ?? 40 ?? 8d 0d ec af 50 00';
    var results = Memory.scanSync(__e.base, __e.size, subsDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[subsDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[subsDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: subsDescription");

        const subsDescriptionAddress = this.context.rdx;
        let subsDescription = subsDescriptionAddress.readUtf8String();

        if (currentSub === subsDescription)
            return;

        currentSub = subsDescription;

        subsDescription = cleanText(subsDescription);

        mainHandler(subsName + "\n" + subsDescription);
    })
})();


(function () {
    const subs1Sig = '0f b6 08 3a 0d ?? ?? ?? ?? 75 ?? 0f b6 48 01 3a 0d ?? ?? ?? ?? 74 ?? 8b 0d ?? ?? ?? ?? f3 0f 10 05 ?? ?? ?? ?? ?? b1 01 f3 0f 11 44 ?? ?? ?? 8b c3';
    var results = Memory.scanSync(__e.base, __e.size, subs1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[subs1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[subs1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: subs1");

        const subsAddress = this.context.rdx;
        let subs = subsAddress.readUtf8String();

        mainHandler(subs);
    })
})();


(function () {
    const subs2Sig = '0fb6083a0d????????75??0fb648013a0d????????74??8b0d??????????b101f30f1174??????8bc3??884c????ffc974??ffc974????8b0d????????eb????8b0d????????eb????8b0d??????????8b01ff9098040000??83c340??83c704??ffce0f85????????66';
    var results = Memory.scanSync(__e.base, __e.size, subs2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[subs2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[subs2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: subs2");

        const subsAddress = this.context.rdx;
        let subs = subsAddress.readUtf8String();

        mainHandler(subs);
    })
})();


function cleanText(text) {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/[\u2460-\u24FF]/g, " ") // Circled numbers and letters
        .replace(/[\u32D0-\u32FE]/g, " ") // Circled katakana
        .replace(/[\u3280-\u32FF]/g, " ") // Circled kanji numbers
        .trim();
}