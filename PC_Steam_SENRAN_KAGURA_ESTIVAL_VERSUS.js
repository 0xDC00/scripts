// ==UserScript==
// @name         SENRAN KAGURA ESTIVAL VERSUS
// @version      1.06
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Tamsoft
// * publisher   Marvelous
//
// https://store.steampowered.com/app/502800/SENRAN_KAGURA_ESTIVAL_VERSUS/
// ==/UserScript==


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);


let isExtracted = false;
(function () {
    const nameSig = 'ff 90 80 00 00 00 8b 45 ab ?? 8b 15 53 92 c7 00 0f 28 45 87';
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

        if (isExtracted)
            return;

        mainHandler(name + "\n" + text);

        isExtracted = true;
    })
})();


let text = '';
(function () {
    const dialogueSig = 'ff 15 ?? ?? ?? ?? ?? 8b 8e 30 0c 00 00';
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

        const textAddress = this.context.rbp;
        text = textAddress.readUtf8String();

        isExtracted = false;
    })
})();


(function () {
    const narrationSig = 'e8 ?? ?? ?? ?? c6 46 1c 01 e9';
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

        const narrationAddress = this.context.rdx;
        let narration = narrationAddress.readUtf8String();

        narration = cleanText(narration);

        mainHandler(narration);
    })
})();


// tips and confirmation prompts
(function () {
    const popUpSig = 'e8 ?? ?? ?? ?? f3 0f 10 44 ?? ?? f3 0f 10 0d';
    var results = Memory.scanSync(__e.base, __e.size, popUpSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[popUpPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[popUpPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: popUp");

        const popUpAddress = this.context.r8;
        let popUp = popUpAddress.readUtf8String();

        popUp = cleanText(popUp);

        mainHandler(popUp);
    })
})();


(function () {
    const menuDescription1Sig = 'ff 90 e0 02 00 00 ?? 8b 07 ?? 8b cf f3 0f 10 0d';
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

        const menuDescriptionAddress = this.context.r9;
        let menuDescription = menuDescriptionAddress.readUtf8String();

        mainHandler(menuDescription);
    })
})();


(function () {
    const menuDescription2Sig = 'ff 90 e0 02 00 00 0f bf 83 1c 0a 00 00 ?? 3b e0';
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

        const menuDescriptionAddress = this.context.r9;
        let menuDescription = menuDescriptionAddress.readUtf8String();

        mainHandler(menuDescription);
    })
})();


let tutorial1 = '';
(function () {
    const tutorial1Sig = 'ff 15 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8b 46 08 33 d2';
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

        const tutorialAddress = this.context.r9;
        let currentTutorial = tutorialAddress.readUtf8String();

        if (currentTutorial === tutorial1)
            return;

        tutorial1 = currentTutorial;

        currentTutorial = cleanText(currentTutorial);

        mainHandler(currentTutorial);
    })
})();


let tutorial2 = '';
(function () {
    const tutorial2Sig = 'ff 90 80 00 00 00 8b 44 ?? 44 33 d2 0f 28 44';
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

        const tutorialAddress = this.context.rdx;
        let currentTutorial = tutorialAddress.readUtf8String();

        if (currentTutorial === tutorial2)
            return;

        tutorial2 = currentTutorial;

        currentTutorial = cleanText(currentTutorial);

        mainHandler(currentTutorial);
    })
})();


// Function is called every frame... It's janky but it works.
let chapterName = '';
let chapterClearCondition = '';
let chapterDescription = '';
let counter = 0;
(function () {
    const chapterDetailsSig = 'e8 ?? ?? ?? ?? f3 0f 10 44 ?? ?? 0f 2f c6 76 ?? f3 0f 5e f0 f3 0f 10 44';
    var results = Memory.scanSync(__e.base, __e.size, chapterDetailsSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[chapterDetailsPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[chapterDetailsPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: chapterDetails");

        counter++;
        const tutorialAddress = this.context.rdi;
        let currentChapterName = '';
        let currentChapterClearCondition = '';
        let currentChapterDescription = '';

        if (counter === 1) {
            currentChapterName = tutorialAddress.readUtf8String();

            if (currentChapterName === chapterName)
                return;

            chapterName = currentChapterName;
        }

        else if (counter === 2 && tutorialAddress.readUtf8String() !== "達成条件") { // To prevent unwanted extraction
            counter = 0;
            return;
        }

        else if (counter === 3) {
            currentChapterClearCondition = tutorialAddress.readUtf8String();

            if (currentChapterClearCondition === chapterClearCondition)
                return;

            chapterClearCondition = currentChapterClearCondition;
        }

        else if (counter === 5) {
            counter = 0;
            currentChapterDescription = tutorialAddress.readUtf8String();

            if (currentChapterDescription === chapterDescription)
                return;

            chapterDescription = currentChapterDescription;

            mainHandler(chapterName + "\n--------------------------\n" + chapterClearCondition + "\n\n" + chapterDescription);
        }
    })
})();


let characterIntroduction;
let timer = null;
(function () {
    const characterIntroductionSig = 'ff 15 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 8b 7c';
    var results = Memory.scanSync(__e.base, __e.size, characterIntroductionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterIntroductionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterIntroductionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: characterIntroduction");

        const tutorialAddress = this.context.r9;
        let currentCharacterIntroduction = tutorialAddress.readUtf8String();

        if (currentCharacterIntroduction === characterIntroduction || currentCharacterIntroduction.length < 20) {
            // Timer to reset 'characterIntroduction' to make sure that a character's personal information gets extracted again from the menu during a mission
            clearTimeout(timer);
            timer = setTimeout(() => {
                characterIntroduction = '';
            }, 500);
            return;
        }

        characterIntroduction = currentCharacterIntroduction;

        mainHandler(currentCharacterIntroduction);
    })
})();


// Two lines of text (on top of each other in custcene) are store separately and the function is called every frame, so this is janky as hell but it's functional.
let temp1 = 'temp1', temp2 = 'temp2';
let cutsceneSubsFull = '';
let counterCutsceneSubs = 0;
(function () {
    const cutsceneSubsSig = 'ff 90 80 00 00 00 8b 44 ?? ?? ?? 8b 0d ?? ?? ?? ?? f3';
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

        const cutsceneSubsAddress = this.context.rdx;
        let currentCutsceneSubs = cutsceneSubsAddress.readUtf8String();
        counterCutsceneSubs++;

        if (counterCutsceneSubs === 1)
            temp1 = currentCutsceneSubs;

        else if (counterCutsceneSubs === 2)
            temp2 = currentCutsceneSubs;


        if (temp1 === temp2) {
            counterCutsceneSubs = 0;

            if (cutsceneSubsFull === currentCutsceneSubs)
                return;

            cutsceneSubsFull = currentCutsceneSubs;
            mainHandler(currentCutsceneSubs);
        }

        else if (temp1 !== temp2 && counterCutsceneSubs !== 1) {
            counterCutsceneSubs = 0;

            let [first, second] = temp1.length >= temp2.length ? [temp1, temp2] : [temp2, temp1];

            if (cutsceneSubsFull === first + "\n" + second)
                return;

            cutsceneSubsFull = first + "\n" + second;

            mainHandler(cutsceneSubsFull);
        }
    })
})();


function cleanText(text) {
    return text
        .replace(/[vw]\d+/g, "")
        .replace(/[□▽]/g, "")
        .replace(/y\d{3}n\d{2}/g, "") // Colored text
        .replace(/<[^>]*>/g, '')
        .replace(/[βμνζχ]/g, ' ')
        .replace(/[\u2460-\u24FF]/g, " ") // Circled numbers and letters
        .replace(/[\u32D0-\u32FE]/g, " ") // Circled katakana
        .replace(/[\u3280-\u32FF]/g, " ") // Circled kanji numbers
        .trim();
}