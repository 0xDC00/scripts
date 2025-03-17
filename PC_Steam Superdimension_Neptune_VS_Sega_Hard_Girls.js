// ==UserScript==
// @name         Superdimension Neptune VS Sega Hard Girls
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Idea Factory, Compile Heart
// * publisher   Idea Factory, Compile Heart
//
// https://store.steampowered.com/app/571530/Superdimension_Neptune_VS_Sega_Hard_Girls/
// ==/UserScript==

console.warn("Unfortunately I wasn't able to hook a whole lot, so an OCR might be needed a few times.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);
const secondaryHandler = trans.send(s => s, '200+');

let currentName = '';
(function () {
    const nameSig = 'e8 ?? ?? ?? ?? c7 03 0a';
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
        currentName = nameAddress.readShiftJisString().trim();
    });
})();


let currentMessage = "";
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

        const dialogueAddress = this.context.eax;
        let dialogue = dialogueAddress.readShiftJisString();

        if (dialogue === currentMessage) // If user presses a button to make the whole text appear it would extract the text again.
            return;

        currentMessage = dialogue;

        if (currentName !== '')
            mainHandler(currentName + "\n" + dialogue);

        else
            mainHandler(dialogue);
    });
})();


(function () {
    const overworldDialogueSig = 'e8 ?? ?? ?? ?? 83 c4 10 33 c0 5b 5f 5e 8b ?? ?? 33 cd e8 ?? ?? ?? ?? 8b e5 5d c3 e8';
    var results = Memory.scanSync(__e.base, __e.size, overworldDialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[overworldDialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[overworldDialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: overworldDialogue");

        const overworldDialogueAddress = this.context.eax;
        let overworldDialogue = overworldDialogueAddress.readShiftJisString();

        mainHandler(overworldDialogue);
    });
})();


(function () {
    const tutorialSig = '38 01 74 ?? 8d ?? ?? 00 8d 49 01';
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

        const tutorialAddress = this.context.ecx;
        let tutorial = tutorialAddress.readShiftJisString();

        if (tutorial.includes("#Icon") || tutorial.length <= 12) // Minor overlap
            tutorial = '';

        mainHandler(tutorial);
    });
})();


let previousMission = "";
(function () {
    const missionSig = 'e8 ?? ?? ?? ?? 8d ?? fc fe ff ff 50 53 e8 ?? ?? ?? ?? ff ?? ?? ?? ?? ?? e8';
    var results = Memory.scanSync(__e.base, __e.size, missionSig);

    if (results.length === 0) {
        console.error('[missionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[missionPattern] Found hook', address);

    function attachHook() {
        const hook = Interceptor.attach(address, function (args) {
            // console.warn("In: mission");

            // Temporarily detach to prevent spamming.
            hook.detach();

            const missionAddress = this.context.ecx;
            let mission = missionAddress.add(1).readShiftJisString();

            if (mission !== previousMission) {
                previousMission = mission;

                secondaryHandler(mission);
            }

            // Reattach after a short delay.
            setTimeout(attachHook, 250);
        });
    }
    attachHook();
})();