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
 * To do: 
 * - Finding a quest description hook.
 * - Filter out the photo descriptions in newspapers.
 */


console.warn("Known issue:\n- Photos in newspapers often have a very short description. That gets extracted and might be in the middle of a sentence of the main text.");

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

    const address = results[0].address.add(0x12);
    console.log('[namePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
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

    const address = results[0].address.add(0x1);
    console.log('[artsDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
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

    const address = results[0].address.add(0x3);
    console.log('[quartzDescriptionPattern] Found hook', address);

    Interceptor.attach(address, function (args) {
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
    let text = '';
    let i = 0;
    let sideText = '';

    if (address.readU8() <= 0x80) return; // Not Shift_JIS, ignore

    while (address.add(i).readU8() !== 0x2) { // 0x2 ends dialogue
        const current = address.add(i);
        const byte1 = current.readU8();
        const byte2 = current.add(1).readU8();
        const byte3 = current.add(2).readU8();
        const byte4 = current.add(3).readU8();

        // Break on control sequence
        if ((byte1 === 0x01 && byte2 === 0x00) || byte1 === 0x00) break;

        // New line
        if (byte1 === 0x01 || byte1 === 0x0A) {
            i++;
            text += '\n';
            continue;
        }

        if (byte1 === 0x20) {
            i++;
            continue;
        }

        // Skip weird spacing in books, typicially in the newspaper
        if (byte1 === 0x81 && byte2 === 0x40) {
            i += 2;
            continue;
        }

        // Skip furigana that starts with #nR and ends with next #
        if (
            byte1 === 0x23 &&                  // '#'
            byte2 >= 0x30 && byte2 <= 0x39     // '0'-'9'
        ) {
            //There can be a second digit
            if (byte3 >= 0x30 && byte3 <= 0x39 && byte4 === 0x52) {
                i += 4;

                // Skip until the next '#' (0x23) or end of dialogue
                while (address.add(i).readU8() !== 0x23 && address.add(i).readU8() !== 0x02) {
                    i++;
                }

                // Skip the ending '#' itself
                if (address.add(i).readU8() === 0x23)
                    i++;
            }

            else if (byte3 === 0x52) {
                i += 3;

                // Skip until the next '#' (0x23) or end of dialogue
                while (address.add(i).readU8() !== 0x23 && address.add(i).readU8() !== 0x02) {
                    i++;
                }

                // Skip the ending '#' itself
                if (address.add(i).readU8() === 0x23)
                    i++;

                continue;
            }
        }

        // Skip color change tag
        if (
            byte1 === 0x23 &&                  // '#'
            byte2 >= 0x30 && byte2 <= 0x39 &&     // '0'-'9'
            byte3 === 0x43                     // 'C'
        ) {
            i += 3;
            continue;
        }

        // If it's ASCII (tipically digits)
        if (address.add(i).readU8() < 0x80) {
            const buffer = new Uint8Array([byte1]);
            text += decoder.decode(buffer);
            i += 1;
        }
        else {
            // Assume 2-byte Shift_JIS
            const buffer = new Uint8Array(address.add(i).readByteArray(2));
            text += decoder.decode(buffer);
            i += 2;
        }
    }

    if (hookName === "dialogue" && !previous.includes(text)) {
        previous = text;
        text = cleanText(text);
        // console.warn(hexdump(address, { header: false, ansi: false, length: 0x200 }));

        if (text.length <= 100)
            mainHandler(name + "\n" + text);
        else
            mainHandler(text); // To not display the name of the last character talked to when reading a book/newspaper
    }
    else if (hookName === "choices") {
        mainHandler(text);
    }
}



function cleanText(text) {
    return text
        .replace(/#[0-9]+I/g, ' ')
        .replace(/#\d+[a-zA-Z]/g, '')
        .replace(/#.*?[0-9A-Za-z]/g, '');
}