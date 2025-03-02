// ==UserScript==
// @name         SENRAN KAGURA Peach Beach Splash
// @version      1.08
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Tamsoft
// * publisher   Marvelous
//
// https://store.steampowered.com/app/696170/SENRAN_KAGURA_Peach_Beach_Splash/
// ==/UserScript==


console.warn("Known issues: \n- There will be a random extraction if you attach the script to the game before the Marvelous logo appears on screen.");
console.warn("- When selecting a Paradise Episode, only the last one will be extracted. They're unlocked one by one, so it's not too bad...")


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);
const secondHandler = trans.send(s => s, 200);


let name = '';
(function () {
    const nameSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 40 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b 97';
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
        name = textAddress.readUtf8String();
    })
})();


let text = '';
(function () {
    const dialogueSig = 'ff 90 80 00 00 00 ?? 8d ?? ?? 40 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8d 8f';
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
        let currentText = textAddress.readUtf8String();

        if (currentText === text || currentText === '')
            return;

        text = currentText;

        mainHandler(name + "\n" + currentText);
    })
})();


let cutsceneSubs = '';
(function () {
    const cutsceneSubsSig = 'e8 ?? ?? ?? ?? 8b c3 e9 ?? ?? ?? ?? ?? 39';
    var results = Memory.scanSync(__e.base, __e.size, cutsceneSubsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[cutsceneSubsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[cutsceneSubsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: cutsceneSubs");

        const textAddress = this.context.rdx;
        let currentCutsceneSubs = textAddress.readUtf8String();

        if (currentCutsceneSubs === cutsceneSubs)
            return;

        cutsceneSubs = currentCutsceneSubs;

        currentCutsceneSubs = cleanText(currentCutsceneSubs);

        mainHandler(currentCutsceneSubs);
    })
})();


(function () {
    const menuDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 85 c0 0f 84 ?? ?? ?? ?? 83';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: menuDescription1");

        const textAddress = this.context.rdx;
        let menuDescription1 = textAddress.readUtf8String();

        mainHandler(menuDescription1);
    })
})();


(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? 8b 1d ?? ?? ?? ?? eb';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: menuDescription2");

        const textAddress = this.context.rdx;
        let menuDescription2 = textAddress.readUtf8String();

        mainHandler(menuDescription2);
    })
})();


(function () { // bottom right of screen
    const subsSig = '3a 08 75 ?? 0f b6 0d';
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

        const textAddress = this.context.rax;
        let subs = textAddress.readUtf8String();

        if (subs === "*" || subs === "シングルスプラッシュ！" || subs === "マルチスプラッシュ！" || subs === "トレーニング！")
            return;

        mainHandler(subs);
    })
})();


let tips = '';
(function () {
    const tipsSig = 'e8 ?? ?? ?? ?? ?? 8d ?? 51 02 00 00 33 d2';
    var results = Memory.scanSync(__e.base, __e.size, tipsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[tipsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[tipsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: tips");

        const textAddress = this.context.rcx;
        let currentTips = textAddress.readUtf8String();

        if (currentTips === tips)
            return;

        tips = currentTips;

        currentTips = cleanText(currentTips);

        mainHandler(currentTips);
    })
})();


(function () {
    const overScreenTextSig = 'e8 ?? ?? ?? ?? c6 46 18 01 e9';
    var results = Memory.scanSync(__e.base, __e.size, overScreenTextSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[overScreenTextPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[overScreenTextPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: overScreenText");

        const textAddress = this.context.rdx;
        let overScreenText = textAddress.readUtf8String();

        overScreenText = cleanText(overScreenText);

        mainHandler(overScreenText);
    })
})();


(function () {
    const gameModeDescriptionSig = '57 ?? 83 ec 20 ?? 8d 79 08 ?? 8b d9';
    var results = Memory.scanSync(__e.base, __e.size, gameModeDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[gameModeDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[gameModeDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: gameModeDescription");

        const textAddress = this.context.rdx;
        let gameModeDescription = textAddress.readUtf8String().trim();

        if (gameModeDescription.length < 15)
            return;

        secondHandler(gameModeDescription);
    })
})();


function cleanText(text) {
    return text
        .replace(/\\n/g, "\n")
        .replace(/<[^>]*>/g, '')
        .replace(/\[[□▽◇]\]/g, "")
        .replace(/[\u2460-\u24FF]/g, " ") // Circled numbers and letters
        .replace(/[\u32D0-\u32FE]/g, " ") // Circled katakana
        .replace(/[\u3280-\u32FF]/g, " ") // Circled kanji numbers
        .trim();
}