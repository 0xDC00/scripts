// ==UserScript==
// @name         Ao no Kiseki / Trails to Azure
// @version      1.2.5
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   NIS America
//
// https://store.steampowered.com/app/1668520/The_Legend_of_Heroes_Trails_to_Azure/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_to_azure
// ==/UserScript==

console.warn("Known issues:\n- Quest progression text extraction from the handbook is a bit weird but everything is there.");
console.warn("- The name of the last character's whose name was displayed will be extracted in places where it shouldn't (e.g. during the tutorial).");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, 200);
const thirdHandler = trans.send(s => s, '50+');


let name = '';
(function () {
    const address = getAddressPattern("name", 'e8 ?? ?? ?? ?? ?? 8b 83 a8 00 00 00 ?? 89 70 10 eb');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rdx;
        name = nameAddress.readShiftJisString();
    });
})();


let previousDialogue = '';
(function () { // Also tutorial 
    const address =  getAddressPattern("dialogue", 'e8 ?? ?? ?? ?? ?? 89 83 90 00 00 00 ?? 8b d0');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: dialogue");

        const dialogueAddress = this.context.rdx;
        let dialogue = readString(dialogueAddress);

        if(previousDialogue.includes(dialogue))
            return;

        previousDialogue = dialogue;
        mainHandler(name + "\n" + dialogue);
    });
})();


(function () {
    const address = getAddressPattern("choices1", 'e8 ?? ?? ?? ?? ?? 8b 4e 10 ?? 8b d8 e8 ?? ?? ?? ?? 0f');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices1");

        const choices1Address = this.context.rdx;
        let choices1 = readString(choices1Address);
        mainHandler(choices1);
    });
})();


(function () {
    const address = getAddressPattern("choices2", 'ff 15 ?? ?? ?? ?? ?? 8d 4d 97 e8 ?? ?? ?? ?? ?? ff');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices2");

        const choices2Address = this.context.rdx;
        let choices2 = readString(choices2Address);
        mainHandler(choices2);
    });
})(); 


let previousMenusDescription = '';
(function () {
    const address =  getAddressPattern("menuDescription", 'e8 ?? ?? ?? ?? 3d 00 04 00 00 0f 8d ?? ?? ?? ?? ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: menuDescription");

        const menuDescriptionAddress = this.context.rbx;
        let menuDescription = menuDescriptionAddress.readShiftJisString();

        if (menuDescription !== previousMenusDescription) { // Sometimes it would print out twice
            previousMenusDescription = menuDescription;
            menuDescription = cleanText(menuDescription);

            secondHandler(menuDescription);
        }
    });
})();


let previousStatusDescription = '';
(function () {
    const address = getAddressPattern("statusDescription", 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 f9 03');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: statusDescription");

        const statusDescriptionAddress = this.context.r9;
        let statusDescription = statusDescriptionAddress.readShiftJisString();

        if (statusDescription !== previousStatusDescription) { // Hook is called every frame
            previousStatusDescription = statusDescription;
            statusDescription = cleanText(statusDescription);
            let statusName = getName(statusDescriptionAddress);

            secondHandler(statusName + '\n' + statusDescription);
        }
    });
})();


let previousArtsDescription = '';
(function () {
    const address = getAddressPattern("artsDescription", '66 66 0f 1f 84 00 00 00 00 00 ?? 0f b6 04 10 88 04 ?? ?? 8d 52 01 84 c0 75 ?? ?? 8b 05', 0xa);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: artsDescription");

        const artsDescriptionAddress = this.context.r8;
        let artsDescription = artsDescriptionAddress.readShiftJisString();

        if (artsDescription !== previousArtsDescription) { // Hook is called every frame
            previousArtsDescription = artsDescription;
            artsDescription = cleanText(artsDescription);
            let artsName = getName(artsDescriptionAddress);

            secondHandler(artsName + '\n' + artsDescription);
        }
    });
})();


let quartzName = '';
let quartzDescription2 = '';
(function () {
    const address =  getAddressPattern("quartzName", '66 66 0f 1f 84 00 00 00 00 00 ?? 0f b6 04 10 88 04 ?? ?? 8d 52 01 84 c0 75 ?? 33', 0xa);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzName");

        const quartzNameAddress = this.context.r9;
        quartzName = quartzNameAddress.readShiftJisString();
        const quartzDescriptionAddress = this.context.r8;
        quartzDescription2 = quartzDescriptionAddress.readShiftJisString();

        if (previousQuartzDescription === quartzDescription2)
            return;

        previousQuartzDescription = quartzDescription2;
        isQuartzPrinted = false;
    });
})();


let isQuartzPrinted = false;
let previousQuartzDescription = '';
(function () {
    const address =  getAddressPattern("quartzDescription1", 'e8 ?? ?? ?? ?? ?? 0f b7 cf c7 44');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: quartzDescription1");

        const quartzDescription1Address = this.context.rdx;
        let quartzDescription1 = quartzDescription1Address.readShiftJisString();
        quartzDescription1 = cleanText(quartzDescription1);

        if (previousQuartzDescription === quartzDescription2 && isQuartzPrinted)
            return;
        
        secondHandler(quartzName + '\n' + quartzDescription1 + '\n' + quartzDescription2);
        isQuartzPrinted = true;
    });
})();


let previousMasterQuartzName = '';
(function () {
    const address = getAddressPattern("masterQuartzName", 'e8 ?? ?? ?? ?? ?? 8b 45 40 f3 0f 10 80 70 01 00 00 f3 0f 58 05 ?? ?? ?? ?? f3 ?? 0f 2c e8 f3 0f 10 88 74 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzName");

        const masterQuartzNameAddress = this.context.r9;

        let masterQuartzName = masterQuartzNameAddress.readShiftJisString();

        if (masterQuartzName !== previousMasterQuartzName) { 
            previousMasterQuartzName = masterQuartzName;
            masterQuartzAbilitiySet.clear();

            thirdHandler(masterQuartzName + "\n");
        }
    });
})();


let masterQuartzAbilitiySet = new Set();
let previousMasterQuartzAbility = '';
(function () {
    const address = getAddressPattern("masterQuartzAbility", 'e8 ?? ?? ?? ?? ff c7 83 ff 06 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: masterQuartzAbility");

        const masterQuartzAbilityAddress = this.context.r9;

        let masterQuartzAbility = masterQuartzAbilityAddress.readShiftJisString();

        if (masterQuartzAbilitiySet.has(masterQuartzAbility))
            return;

        masterQuartzAbilitiySet.add(masterQuartzAbility);
        masterQuartzAbility = cleanText(masterQuartzAbility);

        thirdHandler(masterQuartzAbility);
    });
})();


let previousItemDescription = '';
(function () {
    const address = getAddressPattern("itemDescription", 'e8 ?? ?? ?? ?? ?? 8b ac ?? ?? ?? ?? ?? ?? 8b 05');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemDescription");

        const itemDescriptionAddress = this.context.rax;

        try {
            let itemDescription = itemDescriptionAddress.readShiftJisString();

            if (itemDescription !== previousItemDescription) { // Hook is called every frame
                previousItemDescription = itemDescription;
                itemDescription = cleanText(itemDescription);

                secondHandler(itemDescription);
            }
        }
        catch (e) { /* Somehow the function tries to read something else and keeps failing. */ }
    });
})();


(function () { // Opening a book/newspaper
    const address =  getAddressPattern("book1", '89 88 90 08 00 00 ?? 8b cd ?? 8b 43 40 8b a8 88 01 00 00 ?? 8b b0 8c 01 00 00 e8 ?? ?? ?? ?? ?? 8b 83 a8 00 00 00 ?? 8b cb 66 c7 40 1c 00 02 e8', 0x7a);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: book1");

        const book1Address = this.context.rdx;
        let book1 = readString(book1Address);
        secondHandler(book1);
    });
})();


(function () { // Flipping a page
    const address =  getAddressPattern("book2", 'e8 ?? ?? ?? ?? ?? 89 85 50 01 00 00 ?? 8b 85 68 01 00 00 ?? 89 60 20 ff ?? ?? ?? ?? ?? ?? 8d');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: book2");

        const book2Address = this.context.rdx;
        let book2 = readString(book2Address);
        secondHandler(book2);
    });
})();


(function () { // Flipping back a page
    const address =  getAddressPattern("book3", 'e8 ?? ?? ?? ?? ?? 89 85 50 01 00 00 ff c3 3b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: book3");

        const book3Address = this.context.rdx;
        let book3 = readString(book3Address);
        secondHandler(book3);
    });
})();


let previousQuestName = '';
(function () { // In the handbook
    const address = getAddressPattern("questName1", 'e8 ?? ?? ?? ?? 8b ?? ?? ?? 8d 45 b0 f3 0f 10 3d');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questName1");

        const questNameAddress = this.context.rbx;
        let questName1 = questNameAddress.readShiftJisString();

        if (questName1 !== previousQuestName) {
            thirdHandler(questName1 + "\n\n" + questDescription + '\n');
            previousQuestName = questName1;
            questDescription = '';
            questProgressSet1.clear();
            questProgressSet2.clear();
        }
    });
})();


(function () { // In the terminal
    const address =  getAddressPattern("questName2", 'e8 ?? ?? ?? ?? ?? 8b 4f 18 ?? 81 c1 20 8c 79 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questName2");

        const questName2Address = this.context.rsp.add(40).readPointer();
        let questName2 = questName2Address.readShiftJisString();
        // let questName2 = newReadString(questName2Address, "quest");

        if (questName2 !== previousQuestName) {
            secondHandler(questName2 + "\n\n" + questDescription);

            previousQuestName = questName2;
            previousQuestDescription = '';
            questDescription = '';
        }
    });
})();


let questDescription = '';
let previousQuestDescription = '';
let previousQuestDescriptionAddress = null;
(function () {
    const address =  getAddressPattern("questDescription", '33 c0 ?? 0f b6 01 ?? 3a c4 75', 0x2);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questDescription");

        const questDescriptionAddress = this.context.r9;

        try {
            if (questDescriptionAddress.equals(previousQuestDescriptionAddress.add(0x1))) {
                previousQuestDescriptionAddress = questDescriptionAddress;
                return;
            }
        }
        catch(e) {} 
        previousQuestDescriptionAddress = questDescriptionAddress;

        questDescription = readString(questDescriptionAddress);
            
        if(previousQuestDescription === questDescription) 
            return;

        previousQuestDescription = questDescription;
    });
})(); 


let questProgressSet1 = new Set();
let previousQuestProgressAddress1 = null;
let previousQuestProgress1 = '';
(function () {
    const address =  getAddressPattern("questProgress1", '83 f9 64 ?? 8b 80 b8 62 7a 00 8d 41 9c 0f 42 c1', 0x66);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress1");

        const questProgressAddress = this.context.rbp;

        setTimeout(() => {
        try {
            if (questProgressAddress.equals(previousQuestProgressAddress1.add(0x1))) {
                previousQuestProgressAddress1 = questProgressAddress;
                return;
            }
        }
        catch(e) {} 
        previousQuestProgressAddress1 = questProgressAddress;

        let questProgress1 = readString(questProgressAddress);

        if (previousQuestProgress1.includes(questProgress1))
            return;

        previousQuestProgress1 = questProgress1;
            
        if (questProgressSet1.has(questProgress1)) 
            return;

        questProgressSet1.add(questProgress1);
        
        
            thirdHandler(questProgress1);
        }, 30);
    });
})();


let previousQuestProgress2 = '';
let questProgressSet2 = new Set();
let previousQuestProgressAddress2 = null;
(function () {
    const address =  getAddressPattern("questProgress2", '8b 40 18 ?? 03 c2 8b 6c 10 04 ?? 03 ea', 0x48);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress2");

        const questProgressAddress = this.context.rbp;

        setTimeout(() => {
            try {
                if (questProgressAddress.equals(previousQuestProgressAddress2.add(0x1))) {
                    previousQuestProgressAddress2 = questProgressAddress;
                    return;
                }
            }
            catch(e) {} 
            previousQuestProgressAddress2 = questProgressAddress;
            
            let questProgress2 = readString(questProgressAddress);
            
            if (previousQuestProgress2.includes(questProgress2)) 
                return;
            
            if (questProgressSet2.has(questProgress2))
                return;
            
            questProgressSet2.add(questProgress2);
            
            previousQuestProgress2 = questProgress2;
            thirdHandler(questProgress2);
        }, 30);
    });
})(); 


(function () {
    const address = getAddressPattern("prestory", 'e8 ?? ?? ?? ?? ?? 8b 93 98 00 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: prestory");

        const prestoryAddress = this.context.rdx;
        let prestory = readString(prestoryAddress);
        prestory = cleanText(prestory);
        mainHandler(prestory);
    });
})();


function getAddressPattern(name, pattern, offset = 0) {
    const results = Memory.scanSync(__e.base, __e.size, pattern);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error(`[${name}] Hook not found!`);
        return null;
    }

    if (results.length > 1) 
        console.warn(`[${name}] has ${results.length} results`);

    let address = results[0].address.add(offset);
    console.log(`[${name}] Found hook ${address}`);
    return address;
}


const encoder = new TextEncoder('shift_jis');
const decoder = new TextDecoder('shift_jis');
function readString(address) {
    let character = '';
    let sentence = "";
    const buffer = new Uint8Array(2);

    while (character = address.readU8()) {
        if(character >= 0x20) {
            buffer[0] = character;
            buffer[1] = address.add(1).readU8();
            character = decoder.decode(buffer)[0]; // ShiftJIS: 1->2 bytes.
            sentence += character;
            address = address.add(encoder.encode(character).byteLength);
        }

        else {
            switch (character) {
                case 0x01: // New line
                case 0x0a: // Big font new line?
                    sentence += "\n";
                    address = address.add(1);
                    continue;

                case 0x02: // End of bubble
                    sentence = cleanText(sentence);
                    // address = address.add(1);
                    return sentence;

                case 0x03: // Next bubble
                case 0x04: // Item logo?
                case 0x05: // Green text
                case 0x06: // ??
                case 0x07: // Color change tag
                    if(address.add(1).readU8() === 0x00) { // Avoid new line in tutorial after blue text
                        address = address.add(2);
                        continue;
                    }

                case 0x09: // Something in books/newspaper
                case 0x10: // New line in books/newspaper
                case 0x18: // End of system message?
                case 0x1f: // Item logo?
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


function getName(address) {
    let bytes = [];
    
    // Read bytes backwards to get the name
    address = address.sub(2);

    while (address.readU8()) {
        let byte = address.readU8();

        if (byte === 0x00) 
            break;

        bytes.push(byte);       

        address = address.sub(1);
    }

    bytes.reverse();
    return decoder.decode(Uint8Array.from(bytes));
}


function cleanText(text) {
    return text
        .replace(/#[0-9]+R[^#]*#/g, '')
        .replace(/\b(?:[0-9]{1,2}|100)\.\d%/g, '')
        .replace(/#[0-9]+I/g, ' ')
        .replace(/#%[a-zA-Z]I%[a-zA-Z]/g, '')
        .replace(/#\d+[a-zA-Z]/g, '')
        .replace(/#.*?[0-9A-Za-z]/g, '')
        .replace(/^[�;\u0005!]+/, '')
        .replace(/\\n/g, '\n');
} 