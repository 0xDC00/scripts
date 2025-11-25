// ==UserScript==
// @name         Hajimari no Kiseki 
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   Clouded Leopard Entertainment
//
// https://store.steampowered.com/app/1562940/THE_LEGEND_OF_HEROES_HAJIMARI_NO_KISEKI/
// ==/UserScript==


console.warn("IMPORTANT: I don't recommend playing with mouse & keyboard. Every time I used them to test the script, even for a little bit, when I ALT + TAB'd it would make the other programs non interactable. I had to restart my PC each time. That's how good ports made by CLE are.");
console.warn("\nKnown issues:\n- When selecting a master quartz from the quartz list it might get the name of the last quartz selected (I can't seem to extract master quartz' names, so it's a bit funky).");
console.warn("- When you open the NOTE book or click on the help tab from the start menu there will be a random extraction.");
console.warn("- When wanting to read one of the books it's possible the first page doesn't get extracted. Simply flip the pages and it should be fine.");
console.warn("- If you only have one episode note it will most likely not get extracted until you get a second one (like with the first page of a book, alternating between them should get the text extracted).");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, 200);
const secondHandler = trans.send((s) => s, '200+');
const thirdHandler = trans.send((s) => s, '50+');


(function () {
    const dialogueSig = 'e8 ?? ?? ?? ?? ?? 8b 5c ?? 60 ?? 8b 0d';
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

        const nameAddress = this.context.rdx;
        const textAddress = this.context.r8;

        let name = nameAddress.readUtf8String();
        let text = readString(textAddress);

        if(name !== ' ')
            mainHandler(name + "\n" + text);

        else
            mainHandler(text);

        // console.warn(hexdump(dialogueAddress, { header: false, ansi: false, length: 0x100 }));
    });
})();


(function () {
    const narrationSig = 'e8 ?? ?? ?? ?? ?? b0 01 ?? 8d 54 ?? 40 ?? 8b ce e8';
    var results = Memory.scanSync(__e.base, __e.size, narrationSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[narrationPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[narrationPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: narration");

        const narrationAddress = this.context.r9;
        let narration = readString(narrationAddress);

        mainHandler(narration);
    });
})();


(function () {
    const activeVoiceSig = 'e8 ?? ?? ?? ?? ?? 8d 4d 08 e8 ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, activeVoiceSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[activeVoicePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[activeVoicePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: activeVoice");

        const activeVoiceAddress = this.context.rdx;
        let activeVoice = activeVoiceAddress.readUtf8String();
        activeVoice = cleanText(activeVoice);
        mainHandler(activeVoice);
    });
})();


(function () {
    const systemMessage1Sig = 'e8 ?? ?? ?? ?? ?? 8b ce 89 9e';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage1");

        const systemMessageAddress = this.context.rdx;
        let systemMessage = systemMessageAddress.readUtf8String();
        systemMessage = cleanText(systemMessage);

        mainHandler(systemMessage);
    });
})();


(function () {
    const systemMessage2Sig = 'e8 ?? ?? ?? ?? ?? 8b cb c7 83 78 08';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage2");

        const systemMessageAddress = this.context.rdx;
        let systemMessage = systemMessageAddress.readUtf8String();
        systemMessage = cleanText(systemMessage);

        mainHandler(systemMessage);
    });
})();


(function () {
    const systemMessage3Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8b 0d ?? ?? ?? ?? ba ba 88 00 00 ?? 88 6c ?? ?? 0f';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage3");

        const systemMessageAddress = this.context.rax;
        let systemMessage = systemMessageAddress.readUtf8String();
        systemMessage = cleanText(systemMessage);

        mainHandler(systemMessage);
    });
})();


(function () {
    const systemMessage4Sig = 'ff 15 ?? ?? ?? ?? 33 ff f7 83 b8';
    var results = Memory.scanSync(__e.base, __e.size, systemMessage4Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[systemMessage4Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[systemMessage4Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage4");

        const systemMessageAddress = this.context.rdx;
        let systemMessage = systemMessageAddress.readUtf8String();
        systemMessage = cleanText(systemMessage);

        mainHandler(systemMessage);
    });
})();


(function () {
    const choicesSig = 'e8 ?? ?? ?? ?? c7 46 1c 00 00 80';
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

        const choicesAddress = this.context.rcx;
        let choices = choicesAddress.readUtf8String();
        choices = cleanText(choices);

        secondHandler(choices);
    });
})();


(function () {
    const itemGetDescriptionSig = 'ff 15 ?? ?? ?? ?? ?? 8b cf e8 ?? ?? ?? ?? f3';
    var results = Memory.scanSync(__e.base, __e.size, itemGetDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[itemGetDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[itemGetDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemGetDescription");

        const itemGetDescriptionAddress = this.context.rdx;
        let itemGetDescription = itemGetDescriptionAddress.readUtf8String();
        itemGetDescription = itemGetDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

        secondHandler(itemGetDescription);
    });
})();


let previousMenusDescription = '';
(function () {
    const menuDescription1Sig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 8b d0 00 00 00 e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d';
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

        const menuDescriptionAddress = this.context.rdx;
        let menuDescription = menuDescriptionAddress.readUtf8String();

        if (menuDescription !== previousMenusDescription) {
            previousMenusDescription = menuDescription;
            mainHandler(menuDescription);
        }
    });
})();


(function () {
    const menuDescription2Sig = 'e8 ?? ?? ?? ?? 0f b7 c5 e9 ?? ?? ?? ?? ba';
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

        const menuDescriptionAddress = this.context.rdx;
        let menuDescription = menuDescriptionAddress.readUtf8String();

        if (menuDescription !== previousMenusDescription) {
            previousMenusDescription = menuDescription;
            mainHandler(menuDescription);
        }
    });
})();


(function () {
    const menuDescription3Sig = 'e8 ?? ?? ?? ?? f3 0f 10 87 c8 05';
    var results = Memory.scanSync(__e.base, __e.size, menuDescription3Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[menuDescription3Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[menuDescription3Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription3");

        const menuDescriptionAddress = this.context.rax;
        let menuDescription = menuDescriptionAddress.readUtf8String();

        if (menuDescription !== previousMenusDescription) {
            previousMenusDescription = menuDescription;
            menuDescription = cleanText(menuDescription);

            mainHandler(menuDescription);
        }
    });
})();


let equipmentName = '';
(function () { // Also quartz name
    const equipmentNameSig = 'e8 ?? ?? ?? ?? ?? 89 47 08 0f b6 43 10 83';
    var results = Memory.scanSync(__e.base, __e.size, equipmentNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipmentNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentName");

        const equipmentNameAddress = this.context.rcx;

        if (equipmentName === equipmentNameAddress.readUtf8String())
            return;

        equipmentName = equipmentNameAddress.readUtf8String();
    });
})();


let previousEquipmentDescription = '';
(function () {
    const equipmentDescription1Sig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 ?? 0f b7 c7 eb ?? b8 0f 27 00 00 ?? 8b 8c';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipmentDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription1");

        const equipmentDescriptionAddress = this.context.rdx;
        let equipmentDescription = equipmentDescriptionAddress.readUtf8String();

        if (equipmentDescription !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription;
            equipmentDescription = equipmentDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            mainHandler(equipmentName + "\n" + equipmentDescription);
        }
    });
})();


(function () {
    const equipmentDescription2Sig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 ?? 0f b7 c7 e9 ?? ?? ?? ?? ba';
    var results = Memory.scanSync(__e.base, __e.size, equipmentDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[equipmentDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[equipmentDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: equipmentDescription2");

        const equipmentDescriptionAddress = this.context.rdx;
        let equipmentDescription = equipmentDescriptionAddress.readUtf8String();

        if (equipmentDescription !== previousEquipmentDescription) {
            previousEquipmentDescription = equipmentDescription;
            equipmentDescription = equipmentDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            mainHandler(equipmentName + "\n" + equipmentDescription);
        }
    });
})();


let previousArtDescription = '';
(function () { 
    const artDescriptionSig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 0f b7 c5 e9 ?? ?? ?? ?? ?? 8b bb 68 02 00 00';
    var results = Memory.scanSync(__e.base, __e.size, artDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[artDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[artDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: artDescription");

        const artDescriptionAddress = this.context.rdx;
        let artDescription = artDescriptionAddress.readUtf8String();

        if (artDescription !== previousArtDescription) {
            previousArtDescription = artDescription;
            artDescription = artDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            mainHandler(artDescription);
        }
    });
})();


let previousMasterQuartzDescription = '';
(function () {
    const masterQuartzDescriptionSig = 'e8 ?? ?? ?? ?? 0f b7 c5 eb ?? b8';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzDescription");

        const masterQuartzDescriptionAddress = this.context.rdx;
        let masterQuartzDescription = masterQuartzDescriptionAddress.readUtf8String();

        if (masterQuartzDescription !== previousMasterQuartzDescription) {
            masterQuartzAbilities.clear();
            previousMasterQuartzAbility = '';

            previousMasterQuartzDescription = masterQuartzDescription;
            masterQuartzDescription = masterQuartzDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            
            thirdHandler(masterQuartzDescription + "\n");
        }
    });
})();


let masterQuartzAbilities = new Set();
let previousMasterQuartzAbility = '';
(function () {
    const masterQuartzAbilitySig = 'e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? 33 ff e9';
    var results = Memory.scanSync(__e.base, __e.size, masterQuartzAbilitySig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[masterQuartzAbilityPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[masterQuartzAbilityPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzAbility");

        const masterQuartzAbilityAddress = this.context.rdi;
        let masterQuartzAbility = masterQuartzAbilityAddress.readUtf8String();

        if (masterQuartzAbility !== previousMasterQuartzAbility && !masterQuartzAbilities.has(masterQuartzAbility)) {
            previousMasterQuartzAbility = masterQuartzAbility;
            masterQuartzAbilities.add(masterQuartzAbility);
            masterQuartzAbility = masterQuartzAbility.replace(/#[0-9]+[a-zA-Z]/g, '');
            
            thirdHandler(masterQuartzAbility);
        }
    });
})();


let previousQuartzDescription = '';
(function () { 
    const quartzDescription1Sig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 0f b7 c5 e9 ?? ?? ?? ?? ?? 8b 83 18 04 00 00';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription1");

        const quartzDescriptionAddress = this.context.rdx;
        let quartzDescription = quartzDescriptionAddress.readUtf8String();

        if (quartzDescription !== previousQuartzDescription) {
            previousQuartzDescription = quartzDescription;
            quartzDescription = quartzDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');

            if(equipmentName !== '') {
                mainHandler(equipmentName + "\n" + quartzDescription);
                equipmentName = '';
            }

            else 
                mainHandler(quartzDescription);
            
        }
    });
})();


(function () { 
    const quartzDescription2Sig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 0f b7 c5 eb';
    var results = Memory.scanSync(__e.base, __e.size, quartzDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[quartzDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[quartzDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription2");

        const quartzDescriptionAddress = this.context.rdx;
        let quartzDescription = quartzDescriptionAddress.readUtf8String();

        if (quartzDescription !== previousQuartzDescription) {
            previousQuartzDescription = quartzDescription;
            quartzDescription = quartzDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            mainHandler(equipmentName + "\n" + quartzDescription);
        }
    });
})();


let previousInventoryDescription = '';
(function () {
    const inventoryDescriptionSig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, inventoryDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[inventoryDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[inventoryDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryDescription");

        const inventoryDescriptionAddress = this.context.rdx;
        let inventoryDescription = inventoryDescriptionAddress.readUtf8String();

        if (inventoryDescription !== previousInventoryDescription) {
            previousInventoryDescription = inventoryDescription;
            inventoryDescription = inventoryDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            
            mainHandler(inventoryDescription);
        }
    });
})();


(function () {
    const inventoryDescriptionDLCSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? ?? 8b d8 ?? 85 c0 0f 84';
    var results = Memory.scanSync(__e.base, __e.size, inventoryDescriptionDLCSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[inventoryDescriptionDLCPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[inventoryDescriptionDLCPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryDescriptionDLC");

        const inventoryDescriptionAddress = this.context.rdx;
        let inventoryDescription = inventoryDescriptionAddress.readUtf8String();

        if (inventoryDescription !== previousInventoryDescription) {
            previousInventoryDescription = inventoryDescription;
            // inventoryDescription = inventoryDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            
            mainHandler(inventoryDescription);
        }
    });
})();


let previousStatusDescription = '';
(function () { // S-crafts, crafts and brave orders from the Status tab from the main menu
    const statusDescriptionSig = 'e8 ?? ?? ?? ?? ?? 39 b3 90 00 00 00 75';
    var results = Memory.scanSync(__e.base, __e.size, statusDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[statusDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[statusDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: statusDescription");

        const statusDescriptionAddress = this.context.rdx;
        let statusDescription = statusDescriptionAddress.readUtf8String();

        if (statusDescription !== previousStatusDescription) {
            previousStatusDescription = statusDescription;
            statusDescription = statusDescription.replace(/#\d{1,3}[a-zA-Z]/g, '').replace(/#-[a-zA-Z0-9]+/g, '');
            
            mainHandler(statusDescription);
        }
    });
})();


let previousLinkAbilityDescription = '';
(function () { 
    const linkAbilityDescriptionSig = 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 bb 88';
    var results = Memory.scanSync(__e.base, __e.size, linkAbilityDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[linkAbilityDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[linkAbilityDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: linkAbilityDescription");

        const linkAbilityDescriptionAddress = this.context.rdx;
        let linkAbilityDescription = linkAbilityDescriptionAddress.readUtf8String();

        if (linkAbilityDescription !== previousLinkAbilityDescription) {
            previousLinkAbilityDescription = linkAbilityDescription;
            // linkAbilityDescription = cleanText(linkAbilityDescription);
            
            mainHandler(linkAbilityDescription);
        }
    });
})();


let previousOptionDescription = '';
(function () { 
    const optionDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b 0d ?? ?? ?? ?? ba e6 00 00 00 ?? 8b 89 30 7a 56 00 e8 ?? ?? ?? ?? ?? 8b d0';
    var results = Memory.scanSync(__e.base, __e.size, optionDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[optionDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[optionDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: optionDescription1");

        const optionDescriptionAddress = this.context.rdx;
        let optionDescription = optionDescriptionAddress.readUtf8String();

        if (optionDescription !== previousOptionDescription) {
            previousOptionDescription = optionDescription;
            // optionDescription = cleanText(optionDescription);
            
            mainHandler(optionDescription);
        }
    });
})();


(function () { 
    const optionDescription2Sig = 'e8 ?? ?? ?? ?? ?? 8b 0d ?? ?? ?? ?? ba e6 00 00 00 ?? 8b 89 30 7a 56 00 e8 ?? ?? ?? ?? ?? 8b 8f b0 58 16 00';
    var results = Memory.scanSync(__e.base, __e.size, optionDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[optionDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[optionDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: optionDescription2");

        const optionDescriptionAddress = this.context.rdx;
        let optionDescription = optionDescriptionAddress.readUtf8String();

        if (optionDescription !== previousOptionDescription) {
            previousOptionDescription = optionDescription;
            // optionDescription = cleanText(optionDescription);
            
            mainHandler(optionDescription);
        }
    });
})();


let previousBattleDescription = '';
(function () { // Everything (items, brave orders, crafts, arts)
    const battleDescriptionSig = 'e8 ?? ?? ?? ?? 66 0f 6e 45 84';
    var results = Memory.scanSync(__e.base, __e.size, battleDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[battleDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[battleDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: battleDescription");

        const battleDescriptionAddress = this.context.rdx;
        let battleDescription = battleDescriptionAddress.readUtf8String();
        // console.warn(battleDescription);

        if (battleDescription !== previousBattleDescription) {
            previousBattleDescription = battleDescription;
            battleDescription = battleDescription.replace(/#\d{1,3}[a-zA-Z]/g, '').replace(/#-[a-zA-Z0-9]+/g, '');
            
            mainHandler(battleDescription);
        }
    });
})();


let previousLocationName = '';
(function () { 
    const locationNameSig = 'e8 ?? ?? ?? ?? eb ?? 0f b6 9c';
    var results = Memory.scanSync(__e.base, __e.size, locationNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[locationNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[locationNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: locationName");

        const locationNameAddress = this.context.rdx;
        let locationName = locationNameAddress.readUtf8String();

        if (locationName == previousLocationName) 
            return;

        previousLocationName = locationName;
        secondHandler(locationName);
        
        setTimeout(() => {
            previousLocationName = '';
        }, 30000);
    });
})();


let previousShopItemDescription = '';
(function () { // Generic items
    const shopItemDescription1Sig = 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 81 c4 48 0d 00 00 ?? 5f';
    var results = Memory.scanSync(__e.base, __e.size, shopItemDescription1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[shopItemDescription1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[shopItemDescription1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: shopItemDescription1");

        const shopItemDescriptionAddress = this.context.rdx;
        let shopItemDescription = shopItemDescriptionAddress.readUtf8String();
        // console.warn(shopItemDescription);

        if (shopItemDescription !== previousShopItemDescription) {
            previousShopItemDescription = shopItemDescription;
            shopItemDescription = shopItemDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            
            mainHandler(shopItemDescription);
        }
    });
})();


(function () { 
    const shopItemDescription2Sig = 'e8 ?? ?? ?? ?? 90 ?? 8b 4c ?? ?? ?? 85 c9 74 ?? 0f b6 c1 f6 d0 a8 01 74 ?? e8 ?? ?? ?? ?? 90 ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d';
    var results = Memory.scanSync(__e.base, __e.size, shopItemDescription2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[shopItemDescription2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[shopItemDescription2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: shopItemDescription2");

        const shopItemDescriptionAddress = this.context.rdx;
        let shopItemDescription = shopItemDescriptionAddress.readUtf8String();
        // console.warn(shopItemDescription);

        if (shopItemDescription !== previousShopItemDescription) {
            previousShopItemDescription = shopItemDescription;
            shopItemDescription = shopItemDescription.replace(/#\d{1,3}[a-zA-Z]/g, '');
            
            mainHandler(shopItemDescription);
        }
    });
})();


(function () {
    const bookSig = 'e8 ?? ?? ?? ?? ?? 8b d8 ?? 89 44 ?? ?? 8b 87 48 03 00 00';
    var results = Memory.scanSync(__e.base, __e.size, bookSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[bookPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[bookPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: book");

        const bookAddress = this.context.rcx;
        let book = bookAddress.readUtf8String();
        book = cleanText(book);
        mainHandler(book);
    });
})();


(function () {
    const episodeNoteSig = 'e8 ?? ?? ?? ?? 66 ff c3 0f b7 c3';
    var results = Memory.scanSync(__e.base, __e.size, episodeNoteSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[episodeNotePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[episodeNotePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: episodeNote");

        const episodeNoteAddress = this.context.rdx;
        let episodeNote = episodeNoteAddress.readUtf8String();
        episodeNote = cleanText(episodeNote);
        mainHandler(episodeNote);
    });
})();


let characterNoteTitle = '';
(function () {
    const characterNoteTitleSig = 'e8 ?? ?? ?? ?? 0f 28 b4 ?? ?? ?? ?? ?? 0f 28 bc ?? ?? ?? ?? ?? ?? 81 c4 80 01 00 00';
    var results = Memory.scanSync(__e.base, __e.size, characterNoteTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNoteTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNoteTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNoteTitle");

        const characterNoteTitleAddress = this.context.r9;

        try {
        characterNoteTitle = characterNoteTitleAddress.readUtf8String();
        }
        catch(e) {}

        characterNoteTitle = cleanText(characterNoteTitle);
    });
})();


let previousCharacterNote1 = '';
(function () {
    const characterNote1Sig = 'e8 ?? ?? ?? ?? ?? 0f b7 ab 3c 03 00 00';
    var results = Memory.scanSync(__e.base, __e.size, characterNote1Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNote1Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNote1Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNote1");

        const characterNote1Address = this.context.r9;
        let characterNote1 = characterNote1Address.readUtf8String();

        if (characterNote1 !== previousCharacterNote1) {
            // To extract the additional character details again if the next one viewed doesn't have any unlocked and then back to the same character
            characterDetailsSet.clear();
            previousCharacterNote2 = '';

            previousCharacterNote1 = characterNote1;
            secondHandler(characterNoteTitle + "\n" + characterNote1);
        }
    });
})();


let previousCharacterNote2 = '';
let currentCharacterNote = '';
let characterDetailsSet = new Set();
(function () {
    const characterNote2Sig = 'e8 ?? ?? ?? ?? eb ?? ?? 33 ff f3 0f 10 ?? ?? f3 0f 10 0d';
    var results = Memory.scanSync(__e.base, __e.size, characterNote2Sig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[characterNote2Pattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[characterNote2Pattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterNote2");

        const characterNote2Address = this.context.r9;
        let characterNote2 = characterNote2Address.readUtf8String();

        if (characterNote2 !== previousCharacterNote2 && !characterDetailsSet.has(characterNote2)) {
            previousCharacterNote2 = characterNote2;
            characterDetailsSet.add(characterNote2);
            secondHandler("\n" + characterNote2);
        }
    });
})();


let previousFishNote = '';
(function () { 
    const fishNoteSig = 'e8 ?? ?? ?? ?? 0f 10 ?? ?? ?? 8d ?? d0 ?? 8b 8f e8 02 00 00 f3 ?? 0f 10 ?? ?? f3 0f 10 ?? ?? f3 ?? 0f 58 05 ?? ?? ?? ?? f3 0f 58 3d ?? ?? ?? ?? f3 0f 10 1d ?? ?? ?? ?? ?? 89 44 ?? ?? ?? 8d ?? b0';
    var results = Memory.scanSync(__e.base, __e.size, fishNoteSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[fishNotePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[fishNotePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: fishNote");

        const fishNoteAddress = this.context.r9;
        let fishNote = fishNoteAddress.readUtf8String();

        if (fishNote !== previousFishNote) {
            previousFishNote = fishNote;
            fishNote = cleanText(fishNote);
            mainHandler(fishNote);

            // In case the player has fished only one type of fish
            setTimeout(() => {
                previousFishNote = '';
            }, 60000);
        }
    });
})();


let crossStoryTitle = '';
(function () { 
    const crossStoryTitleSig = 'e8 ?? ?? ?? ?? f3 0f 10 ?? ?? f3 ?? 0f 10 05';
    var results = Memory.scanSync(__e.base, __e.size, crossStoryTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[crossStoryTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[crossStoryTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: crossStoryTitle");

        const crossStoryTitleAddress = this.context.rdx;
        crossStoryTitle = crossStoryTitleAddress.readUtf8String();
    });
})();


let previousCrossStoryDescription = '';
(function () { 
    const crossStoryDescriptionSig = 'e8 ?? ?? ?? ?? f3 0f 10 ?? ?? 0f 2f cf 76 ?? f3 0f 10 05';
    var results = Memory.scanSync(__e.base, __e.size, crossStoryDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[crossStoryDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[crossStoryDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: crossStoryDescription");

        const crossStoryDescriptionAddress = this.context.rdx;
        let crossStoryDescription = crossStoryDescriptionAddress.readUtf8String();

        if (crossStoryDescription !== previousCrossStoryDescription) {
            previousCrossStoryDescription = crossStoryDescription;
            mainHandler(crossStoryTitle + "\n" + crossStoryDescription);
        }
    });
})();


let missionTitle = '';
(function () {
    const missionTitleSig = '83 e0 01 ?? 2b c8 ?? 89 ?? ?? ?? ?? ?? ?? ?? 8d ?? ?? 30 ?? b8 80 00 00 00 ?? 8b';
    var results = Memory.scanSync(__e.base, __e.size, missionTitleSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[missionTitlePattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x21);
    console.log('[missionTitlePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: missionTitle");

        const missionTitleAddress = this.context.r9;
        missionTitle = missionTitleAddress.readUtf8String();
        missionTitle = cleanText(missionTitle);
    });
})();


(function () {
    const missionDescriptionSig = 'e8 77 29 00 00 ?? 8d 8c ?? 90';
    var results = Memory.scanSync(__e.base, __e.size, missionDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[missionDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[missionDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: missionDescription");

        const missionDescriptionAddress = this.context.r9;
        let missionDescription = missionDescriptionAddress.readUtf8String();
        missionDescription = cleanText(missionDescription);
        mainHandler(missionTitle + "\n" + missionDescription);
    });
})();


let daydreamShopName = '';
(function () { 
    const daydreamShopNameSig = 'e8 ?? ?? ?? ?? ?? 8b f8 ?? 85 c0 74 ?? ?? 8b 8b f0 02 00 00 ?? 85 c9 74 ?? 0f b6 d1 f6 d2 f6 c2 01 74 ?? e8 ?? ?? ?? ?? ?? 89 bb f0 02 00 00 33 d2 ?? b8 04 02 00 00 ?? 8d ?? b0 e8 ?? ?? ?? ?? 0f b6 46 20';
    var results = Memory.scanSync(__e.base, __e.size, daydreamShopNameSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[daydreamShopNamePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[daydreamShopNamePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: daydreamShopName");

        const daydreamShopNameAddress = this.context.rcx;
        daydreamShopName = daydreamShopNameAddress.readUtf8String();
        daydreamShopName = cleanText(daydreamShopName);
    });
})();


let previousDaydreamShopDescription = '';
(function () { 
    const daydreamShopDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b f8 ?? 85 c0 0f 84 ?? ?? ?? ?? ?? 8b 8b f0 02 00 00';
    var results = Memory.scanSync(__e.base, __e.size, daydreamShopDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[daydreamShopDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[daydreamShopDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: daydreamShopDescription");

        const daydreamShopDescriptionAddress = this.context.rcx;
        let daydreamShopDescription = daydreamShopDescriptionAddress.readUtf8String();

        if (daydreamShopDescription !== previousDaydreamShopDescription) {
            previousDaydreamShopDescription = daydreamShopDescription;
            daydreamShopDescription = cleanText(daydreamShopDescription);

            mainHandler(daydreamShopName + "\n" + daydreamShopDescription);

            // In case there's only one option
            setTimeout(() => {
                previousDaydreamShopDescription = '';
            }, 60000);
        }
    });
})();


let previousDaydreamResult = '';
(function () { // When obtaining a new daydream to view
    const daydreamResultSig = 'e8 ?? ?? ?? ?? ?? 89 ?? ?? c7 44 ?? ?? 03';
    var results = Memory.scanSync(__e.base, __e.size, daydreamResultSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[daydreamResultPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[daydreamResultPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: daydreamResult");

        const daydreamResultAddress = this.context.rax;
        let daydreamResult = daydreamResultAddress.readUtf8String();

        if (daydreamResult !== previousDaydreamResult) {
            previousDaydreamResult = daydreamResult;
            daydreamResult = cleanText(daydreamResult);

            mainHandler(daydreamResult);
        }
    });
})();


let previousDaydreamItemResultDescription = '';
(function () { // When obtaining at least one new item via the daydream item gacha
    const daydreamItemResultDescriptionSig = 'e8 ?? ?? ?? ?? ?? 8b 4f 70 ?? 8b 01';
    var results = Memory.scanSync(__e.base, __e.size, daydreamItemResultDescriptionSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[daydreamItemResultDescriptionPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[daydreamItemResultDescriptionPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("in: daydreamItemResultDescription");

        const daydreamItemResultDescriptionAddress = this.context.rdx;
        let daydreamItemResultDescription = daydreamItemResultDescriptionAddress.readUtf8String();

        if (daydreamItemResultDescription !== previousDaydreamItemResultDescription) {
            previousDaydreamItemResultDescription = daydreamItemResultDescription;
            daydreamItemResultDescription = cleanText(daydreamItemResultDescription);

            mainHandler(daydreamItemResultDescription);
        }
    });
})();


const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
function readString(address) {
    let character = '';
    let sentence = "";

    while (character = address.readU8()) {
        if (character < 0x80 && address.add(1).readU8() === 0x01) { // Sometimes a random character would be extracted instead of the item name when obtaining something
            address = address.add(1);
            continue;
        }

        if (character >= 0x20) {
            character = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
            sentence += character;
            address = address.add(encoder.encode(character).byteLength);
        }

        else {
            switch (character) {

                case 0x01: // New line
                    sentence += "\n";
                    address = address.add(1);
                    continue;

                case 0x02: // Next bubble
                    address = address.add(1);
                    continue;

                case 0x03: // End of bubble
                    address = address.add(1);
                    sentence += "\n\n";
                    continue;

                case 0x04: // Item logo?
                case 0x06: // Item logo?
                case 0x07: // Item logo?
                case 0x08:
                case 0x0a:
                case 0x0b: // Green text
                case 0x0c:
                    address = address.add(1);
                    continue;

                case 0x0e: // Item reference?
                    address = address.add(3);
                    continue;

                case 0x0f: // Narration start/blue-ish text?
                case 0x10: // Item name?
                    address = address.add(1);
                    continue;

                case 0x11:
                    address = address.add(5);
                    continue;

                case 0x18:
                case 0x19:
                case 0x1a: // Narration end
                    address = address.add(1);
                    continue;

                default:
                    console.warn(`unhandled code: ${ptr(character)}`);
                    console.warn(hexdump(address, { header: false, ansi: false, length: 0x50 }));
                    address = address.add(1);
                    continue;
            }
        }
    }
    sentence = cleanText(sentence);
    return sentence;
}


function cleanText(text) {
    return text
        .replace(/#[0-9]+R[^#]+#/g, '') // Furigana
        .replace(/#[a-zA-Z0-9]+/g, '')
        .replace(/\[[a-zA-Z0-9]+\]/g, '')
        .replace(/\[[a-zA-Z0-9]+\]/g, '') // Redundant but there can be nested brackets
        .replace(/[a-zA-Z0-9]?_[a-zA-Z0-9]+/g, '')
        .replace(/#[a-zA-Z]_[0-9]+/g, '')
        .replace(/#-[a-zA-Z0-9]+/g, '')
        .replace(/<[a-zA-Z0-9/]+>/g, '')
        .replace(/%[a-zA-Z0-9]/g, '')
        .replace(/�/g, '')
        .replace(/\\n/g, '\n');
}