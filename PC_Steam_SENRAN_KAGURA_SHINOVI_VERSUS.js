// ==UserScript==
// @name         SENRAN KAGURA SHINOVI VERSUS
// @version      1.06
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Tamsoft
// * publisher   Marvelous
//
// https://store.steampowered.com/app/411830/SENRAN_KAGURA_SHINOVI_VERSUS/
// ==/UserScript==


console.warn("Known issue: from the chapter select screen, if you decide to go back the chapter at the top of the list will have its content extracted for some reason.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? 8b ?? ?? 89 86 28 10 00 00';
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

        const nameAddress = this.context.edx;
        let name = nameAddress.readUtf16String();

        const textAddress = this.context.eax;
        let text = textAddress.readUtf16String();

        if (name === null || text.includes("□")) {
            text = cleanText(text);
            mainHandler(text);
        }

        else
            mainHandler(name + "\n" + text);
    })
})();


// tips and confirmation prompts
let currentPopUp = '';
let timer = null;
(function () {
    const popUpSig = '0f b7 01 33 f6 ba 01 00 00 00';
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

        const popUpAddress = this.context.ecx;
        let popUp = popUpAddress.readUtf16String();

        if (currentPopUp === popUp) {
            // Timer to reset 'currentPopUp' to make sure that a character's personal information gets extracted again from the menu during a mission
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentPopUp = '';
            }, 500);
            return;
        }

        currentPopUp = popUp;

        popUp = cleanText(popUp);

        mainHandler(popUp);
    })
})();


(function () {
    const tutorialSig = 'e8 d8 51 ee ff 83 c4 10';
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

        const tutorialAddress = this.context.eax;
        let tutorial = tutorialAddress.readUtf16String();

        tutorial = cleanText(tutorial);

        mainHandler(tutorial);
    })
})();


let selectChapterName = '';
(function () {
    const selectChapterNameSig = 'e8 ?? ?? ?? ?? 83 c4 04 f3 0f 10 05 ?? ?? ?? ?? f3 0f 10 8e 00 03 00 00';
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

        const chapterNameAddress = this.context.ecx;
        selectChapterName = chapterNameAddress.readUtf16String();
    })
})();


let selectChapterClearCondition = '';
(function () {
    const selectChapterClearConditionSig = 'e8 6a 9b 05 00 83 c4 08 83 f8 01';
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

        const chapterClearConditionAddress = this.context.ecx;
        selectChapterClearCondition = chapterClearConditionAddress.readUtf16String();
    })
})();


let chapterDescription = ''; // Also used for the pause version since I can't seem to hook the description
(function () {
    const selectChapterDescriptionSig = '0f b7 07 83 c4 0c 66 85 c0 0f 84 ?? ?? ?? ?? ba';
    var results = Memory.scanSync(__e.base, __e.size, selectChapterDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[selectChapterDescription] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[selectChapterDescription] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: selectChapterDescription");

        const chapterDescriptionAddress = this.context.edi;
        let currentChapterDescription = chapterDescriptionAddress.readUtf16String();

        if (chapterDescription === currentChapterDescription)
            return;

        chapterDescription = currentChapterDescription;

        mainHandler(selectChapterName + "\n--------------------------\n" + selectChapterClearCondition + "\n\n" + currentChapterDescription);
    })
})();


let pauseChapterName = '';
(function () {
    const pauseChapterNameSig = 'e8????????83c40883f8010f8c????????f30f1044????f30f5905????????0f284c????f30f105c????f30f1054????f30f5cc8f30f1044????f30f1105????????0f';
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

        const chapterNameAddress = this.context.ecx;
        pauseChapterName = chapterNameAddress.readUtf16String();
    })
})();


let currentChapterClearCondition = '';
(function () {
    const pauseChapterClearConditionSig = 'e8 ?? ?? ?? ?? 8b 74 ?? ?? 83 c4 20 0f bf 0e 03 4c';
    var results = Memory.scanSync(__e.base, __e.size, pauseChapterClearConditionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[pauseChapterClearConditionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[pauseChapterClearConditionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: pauseChapterClearCondition");

        const chapterClearConditionAddress = this.context.ecx;
        let pauseChapterClearCondition = chapterClearConditionAddress.readUtf16String();

        if (pauseChapterClearCondition === currentChapterClearCondition) {
            // Timer to reset 'currentChapterClearCondition' to make sure that the content gets extracted again at each pause
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentChapterClearCondition = '';
            }, 500);
            return;
        }

        currentChapterClearCondition = pauseChapterClearCondition;

        mainHandler(pauseChapterName + "\n--------------------------\n" + pauseChapterClearCondition + "\n\n" + ChapterDescription)
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