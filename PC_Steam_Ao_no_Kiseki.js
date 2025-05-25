// ==UserScript==
// @name         Ao no Kiseki / Trails to Azure
// @version      1.1.19
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   NIS America
//
// https://store.steampowered.com/app/1668520/The_Legend_of_Heroes_Trails_to_Azure/
// ==/UserScript==

/**
 * To do: find better dialogue hook and finding a quest description hook (I don't want to go too far as to not spoil myself as I haven't played the prequel yet).
 */


console.warn("Known issues:\n- There may be junk text extracted some times, though it doesn't seem as bad as the prequel. Except for the conversation log. Dettach the script before checking the log.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+\n+');
const menuHandler = trans.send(s => s, 200);


(function () {
    const nameSig = '0f b6 13 ?? 81 c1 40 08 00 00 84 d2 74';
    var results = Memory.scanSync(__e.base, __e.size, nameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[namePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[namePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rbx;
        let name = nameAddress.readShiftJisString();

        mainHandler(name);
    });
})();


(function () {
    const dialogueSig = 'eb ?? ?? 88 09 ?? 0f b6 40 01 ?? 83 c0 02 ?? 88 41 01 ?? 83 c1 02 eb';
    var results = Memory.scanSync(__e.base, __e.size, dialogueSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[dialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[dialoguePattern] Found hook', address);

    // const matchAddr = results[0].address;
    // const movzxOffset = 0x14;
    // const hookAddr = matchAddr.add(movzxOffset); // To start the logic from this point as I had to hook from an earlier place

    Interceptor.attach(address, function (args) {
        // console.warn("in: dialogue");

        const dialogueAddress = this.context.r8;
        let dialogue = dialogueAddress.readShiftJisString();
        // mainHandler(dialogue);
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


let previousCraftDescription = '';
(function () {
    const craftDescriptionSig = 'e8 cf 72 0c 00 ?? 83 c4 48 c3 cc';
    var results = Memory.scanSync(__e.base, __e.size, craftDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[craftDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[craftDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: craftDescription");

        const craftDescriptionAddress = this.context.rbx;

        try {
            let craftDescription = craftDescriptionAddress.readShiftJisString();

            if (craftDescription !== previousCraftDescription) { // Hook is called every frame
                previousCraftDescription = craftDescription;
                craftDescription = craftDescription.replace(/\\n/g, '\n');

                menuHandler(craftDescription);
            }
        }
        catch (e) { /* This is purely to remove the error in a specific part of the menu */ }
    });
})();


let previousArtsDescription = '';
(function () {
    const artsDescriptionSig = '0f 1f 40 00 ?? 0f b6 04 10 88 04 ?? ?? 8d 52 01 84 c0 75 ?? ?? 8b 05';
    var results = Memory.scanSync(__e.base, __e.size, artsDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artsDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artsDescriptionPattern] Found hook', address);

    const matchAddr = results[0].address;
    const movzxOffset = 0x4;
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
    const quartzDescriptionSig = '66 66 66 0f 1f 84 00 00 00 00 00 ?? 0f b6 04 12 88 04';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescriptionPattern] Found hook', address);

    const matchAddr = results[0].address;
    const movzxOffset = 0xb;
    const hookAddr = matchAddr.add(movzxOffset); // To start the logic from this point as I had to hook from an earlier place

    Interceptor.attach(hookAddr, function (args) {
        // console.warn("in: quartzDescription");

        const quartzDescriptionAddress = this.context.rax;

        try {
            let quartzDescription = quartzDescriptionAddress.readShiftJisString();

            if (quartzDescription !== previousQuartzDescription) { // Hook is called every frame
                previousQuartzDescription = quartzDescription;
                quartzDescription = quartzDescription.replace(/\\n/g, '\n');

                menuHandler(quartzDescription);
            }
        }
        catch (e) { /* This is purely to remove the error in a specific part of the menu */ }
    });
})();


let previousItemDescription = '';
(function () {
    const itemDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b ac ?? ?? ?? ?? ?? ?? 8b 05';
    var results = Memory.scanSync(__e.base, __e.size, itemDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemDescription");

        const itemDescriptionAddress = this.context.rax;

        try {
            let itemDescription = itemDescriptionAddress.readShiftJisString();

            if (itemDescription !== previousItemDescription) { // Hook is called every frame
                previousItemDescription = itemDescription;
                itemDescription = itemDescription.replace(/\\n/g, '\n');

                menuHandler(itemDescription);
            }
        }
        catch (e) { /* Somehow the function tries to read something else and keeps failing. */ }
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
            text = cleanText(text) + "\n";
            // mainHandler(name + "\n" + text);
            mainHandler(text);
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