// ==UserScript==
// @name         Hyperdimension Neptunia Re;Birth3 V Generation
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Idea Factory, Compile Heart
// * publisher   Idea Factory, Compile Heart
//
// https://store.steampowered.com/app/353270/Hyperdimension_Neptunia_ReBirth3_V_Generation/
// ==/UserScript==


console.warn("Unfortunately I wasn't able to hook a whole lot, so an OCR might be needed a few times.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);


let name = '';
(function () {
    const nameSig = 'e8 ?? ?? ?? ?? c7 03 0a 00 00 00 5b 33 c0 5e 5d c3';
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

        const nameAddress = this.context.eax;
        name = nameAddress.readShiftJisString().trim();
    });
})();


let text = '';
(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? 83 c4 08 a1 ?? ?? ?? ?? c7';
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

        const textAddress = this.context.eax;
        let currentText = textAddress.readShiftJisString();

        if (currentText === text)
            return;

        text = currentText;

        if (name === '')
            mainHandler(currentText);

        else
            mainHandler(name + "\n" + currentText);
    });
})();


(function () {
    const tutorialSig = 'e8 ?? ?? ?? ?? 83 c4 08 85 c0 74 ?? 8b 86 08 01 00 00 57 85 c0';
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
        let tutorial = tutorialAddress.readShiftJisString().trim();

        mainHandler(tutorial);
    });
})();


(function () {
    const chibiDialogueSig = 'e8 ?? ?? ?? ?? 83 c4 10 33 c0 5b 5f 5e 8b ?? ?? 33 cd e8 ?? ?? ?? ?? 8b e5 5d c3 e8 ?? ?? ?? ?? f3 0f 10 0d';
    var results = Memory.scanSync(__e.base, __e.size, chibiDialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[chibiDialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[chibiDialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: chibiDialogue");

        const chibiDialogueAddress = this.context.eax;
        let chibiDialogue = chibiDialogueAddress.readShiftJisString().trim();

        mainHandler(chibiDialogue);
    });
})();