// ==UserScript==
// @name         Zero no Kiseki / Trails from Zero
// @version      1.4.13
// @author       T4uburn (found dialogue hook and its logic) & Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   NIS America
//
// https://store.steampowered.com/app/1668510/The_Legend_of_Heroes_Trails_from_Zero/
// ==/UserScript==


/**
 * To do: finding a better hook for the dialogue and finding a hook for the quests' descriptions.
 */


console.warn("Known issues:\n- Furigana, larger fonts and colored text make Agent freak out, so expect some junk sometimes, especially in the tutorial and when buying something.");
console.warn("The same happens if you open the conversation log. Dettach the script beforhand if you want to consult the log, and attach it again when the log is closed.");
console.warn("\nTo do: finding a hook for the quests' descriptions.");

const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const menuHandler = trans.send(s => s, 200);


let name = '';
(function () {
    const nameSig = '89 54 ?? 60 ?? 8b 8f a8 00 00 00 ?? 8d 81 40 08 00 00 ?? 38 38 74 15';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[namePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[namePattern] Found hook', address);

    const matchAddr = results[0].address;
    const leaOffset = 0x12;
    const hookAddr = matchAddr.add(leaOffset); // To start the logic from this point as I had to hook from an earlier place

    Interceptor.attach(hookAddr, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rax;
        name = nameAddress.readShiftJisString();
    });
})();


(function () {
    const dialogueSig = '0F B6 03 3C ?? 0F 83 ?? ?? ?? ?? 48 FF C3 83 ?? ?? ?? ?? 41 8B 8C 82 ?? ?? ?? ?? 49 03 CA FF E1 66 44 89 6A';
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

        const dialogueAddress = this.context.rbx;
        readString(dialogueAddress, "dialogue");
    });
})();



(function () {
    const choicesSig = 'e8 ?? ?? ?? ?? ?? 8b 4f 10 81 89';
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

        const choicesAddress = this.context.rdx;
        readString(choicesAddress, "choices");
    });
})();


let previousMenusDescription1 = '';
(function () {
    const menuDescription1Sig = 'e8 ?? ?? ?? ?? 3d 00 04 00 00 0f 8d ?? ?? ?? ?? ?? 8b 47 40';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription1");

        const menuDescription1Address = this.context.rbx;
        let menuDescription1 = menuDescription1Address.readShiftJisString();

        if (menuDescription1 !== previousMenusDescription1) { // Sometimes it would print out twice
            previousMenusDescription1 = menuDescription1;
            menuDescription1 = menuDescription1.replace(/\\n/g, '\n');

            menuHandler(menuDescription1);
        }
    });
})();


let previousMenusDescription2 = '';
(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? ?? 8b bc ?? ?? ?? ?? ?? ?? 8b b4 ?? ?? ?? ?? ?? ?? 8b 9c';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription2");

        const menuDescription2Address = this.context.rax;

        try {
            let menuDescription2 = menuDescription2Address.readShiftJisString();

            if (menuDescription2 !== previousMenusDescription2) { // Hook is called every frame
                previousMenusDescription2 = menuDescription2;
                menuDescription2 = menuDescription2.replace(/\\n/g, '\n');

                menuHandler(menuDescription2);
            }
        }
        catch (e) { /* This is purely to remove the error in a specific part of the menu */ }
    });
})();


let previousArtsDescription = '';
(function () {
    const artsDescriptionSig = '90 ?? 0f b6 04 10 88 04 ?? ?? 8d 52 01 84 c0 75';
    var results = Memory.scanSync(__e.base, __e.size, artsDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artsDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artsDescriptionPattern] Found hook', address);

    const matchAddr = results[0].address;
    const movzxOffset = 0x1;
    const hookAddr = matchAddr.add(movzxOffset); // To start the logic from this point as I had to hook from an earlier place

    Interceptor.attach(hookAddr, function (args) {
        // console.warn("in: artsDescription");

        const artsDescriptionAddress = this.context.r8;
        let artsDescription = artsDescriptionAddress.readShiftJisString();

        if (artsDescription !== previousArtsDescription) { // Hook is called every frame
            previousArtsDescription = artsDescription;
            artsDescription = artsDescription.replace(/\\n/g, '\n');

            menuHandler(artsDescription);
        }
    });
})();


let previousQuartzDescription = '';
(function () {
    const quartzDescriptionSig = '0f 1f 00 ?? 0f b6 04 12 88 04 11 ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescriptionPattern] Found hook', address);

    const matchAddr = results[0].address;
    const movzxOffset = 0x3;
    const hookAddr = matchAddr.add(movzxOffset); // To start the logic from this point as I had to hook from an earlier place

    Interceptor.attach(hookAddr, function (args) {
        // console.warn("in: quartzDescription");

        const quartzDescriptionAddress = this.context.r10;
        let quartzDescription = quartzDescriptionAddress.readShiftJisString();

        if (quartzDescription !== previousQuartzDescription) { // Hook is called every frame
            previousQuartzDescription = quartzDescription;
            quartzDescription = quartzDescription.replace(/\\n/g, '\n');

            menuHandler(quartzDescription);
        }
    });
})();


const decoder = new TextDecoder('shift_jis');
let previous = '';
function readString(address, hookName) {
    var text = '';
    var byte = address.readU8();

    if (byte > 0x80) {
        var i = 0;

        while (address.add(i).readU8() != 0x2) { // 0x2 ends current dialogue

            if (address.add(i).readU8() == 0x1 && address.add(i + 1).readU8() == 0x0)
                break;

            if (address.add(i).readU8() == 0x1) { // New line
                text = text + '\n';
                i++;
            }

            else {
                var buffer = new Uint8Array(address.add(i).readByteArray(2));
                text = text + decoder.decode(buffer);
                i += 2;
            }
        }

        if (!previous.includes(text) && hookName === "dialogue") {
            previous = text;
            text = cleanText(text);
            mainHandler(name + "\n" + text);
        }

        else if (hookName === "choices")
            mainHandler(text);
    }
}



function cleanText(text) {
    return text
        .replace(/#.*?[A-Za-z]/g, '')
        .replace(/~.*?#/gs, '')
        .replace(/[A-Za-z0-9][^#]*#/g, '')
        .replace(/[\uFF61-\uFF9F][\s\S]*?#/g, '')
        .replace(/[\uFF61-\uFF9F]+/g, '')
        .replace(/([ァ-ンー])　+/g, '')
        .replace(/[A-Za-z0-9]/g, '')
        .replace(/�/g, '');
}