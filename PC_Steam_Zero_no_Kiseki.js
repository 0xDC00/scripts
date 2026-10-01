// ==UserScript==
// @name         Zero no Kiseki / 零の軌跡 /  Trails from Zero
// @version      1.5.5
// @author       Tom (tomrock645)
// @description  Steam, GOG
// * developer   Nihon Falcom
// * publisher   NIS America
//
// https://store.steampowered.com/app/1668510/The_Legend_of_Heroes_Trails_from_Zero/
// https://www.gog.com/en/game/the_legend_of_heroes_trails_from_zero
// ==/UserScript==


console.warn("Known issues:\n- Quest progression text extraction from the handbook is a bit weird but everything is there.");
console.warn("- If at least two characters talk at the same time, extraction will be weird.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, 200);
const thirdHandler = trans.send(s => s, '25+');


let name = '';
(function () {
    const address =  getAddressPattern("name", 'e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 83 c3 40 ?? 3b df 75 ?? ?? 8b 5c');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rcx;
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
    const address =  getAddressPattern("choices", 'e8 ?? ?? ?? ?? ?? 8b 4e 10 ?? 8b d8 e8 ?? ?? ?? ?? 0f');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices");

        const choicesAddress = this.context.rdx;
        let choices = readString(choicesAddress);
        mainHandler(choices);
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


let quartzName = '';
let quartzDescription2 = '';
(function () {
    const address =  getAddressPattern("quartzName", '0f 1f 00 ?? 0f b6 04 10 88 04 ?? ?? 8d', 0x3);
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
    const address =  getAddressPattern("quartzDescription1", 'e8 ?? ?? ?? ?? 0f b6 ?? ?? 32 c0 84 db 74');
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


let previousArtsDescription = '';
(function () {
    const address =  getAddressPattern("artsDescription", '90 ?? 0f b6 04 01 ?? 88 04 ?? ?? 8d', 0x1);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: artsDescription");

        const artsDescriptionAddress = this.context.rcx;
        let artsDescription = artsDescriptionAddress.readShiftJisString();

        if (previousArtsDescription === artsDescription) // Hook called every frame
            return;

        previousArtsDescription = artsDescription;
        artsDescription = cleanText(artsDescription);
        let artsName = getName(artsDescriptionAddress);

        secondHandler(artsName + '\n' + artsDescription);
    });
})();


let previousDescription = '';
(function () { // Various item description from the menu (e.g. equipment, inventory), art description and craft description in battle 
    const address =  getAddressPattern("itemDescription", 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 10 04 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: itemDescription");

        try {
            const itemDescriptionAddress = this.context.rax;
            let itemDescriptionDescription = itemDescriptionAddress.readShiftJisString();

            if (itemDescriptionDescription !== previousDescription && itemDescriptionDescription.length > 8) { // Hook is called every frame
                previousDescription = itemDescriptionDescription;
                itemDescriptionDescription = cleanText(itemDescriptionDescription);
                secondHandler(itemDescriptionDescription);
            }
        }
        catch(e) { /* I don't think it's necessary but just in case */ }
    });
})(); 


(function () { // Opening a book/newspaper
    const address =  getAddressPattern("book1", 'e8 ?? ?? ?? ?? ?? 8b f0 ?? 8b 4b 40 0f bf 81 7e 01 00 00');
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
    const address =  getAddressPattern("book3", 'e8 ?? ?? ?? ?? ?? 89 85 50 01 00 00 ff c3 3b ?? ?? ?? ?? ?? 7c');
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
    const address =  getAddressPattern("questName1", 'e8 ?? ?? ?? ?? f3 0f 10 3d ?? ?? ?? ?? ?? 8d 44 ?? b0');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questName1");

        const questName1Address = this.context.r8;
        let questName1 = questName1Address.readShiftJisString();

        if (questName1 !== previousQuestName) {
            thirdHandler(questName1 + "\n\n" + questDescription +'\n');

            previousQuestName = questName1;
            questDescription = '';
            questProgressSet1.clear();
            questProgressSet2.clear();
            questProgressSet3.clear();
            questProgressSet4.clear();
        }
    });
})();


(function () { // In the terminal
    const address =  getAddressPattern("questName2", 'e8 ?? ?? ?? ?? ?? 8b 4f 18 ?? 8d ?? ?? d0 00 00 00');
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
    const address =  getAddressPattern("questDescription", '33 c0 ?? 0f b6 01 ?? 80 f8 01 75', 0x2);
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
    const address =  getAddressPattern("questProgress1", '33 c0 ?? 0f b6 17 80 fa 01 75 ?? 85 c0 74 ?? ?? 8d 04 30 ff c6', 0x2);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress1");

        const questProgressAddress = this.context.r15;

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
            
        if(questProgressSet1.has(questProgress1)) 
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
    const address =  getAddressPattern("questProgress2", '8b 40 18 ?? 03 c3 ?? 8b 7c 10 fc ?? 03 fa ?? 8b cf e8', 0x50);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress2");

        const questProgressAddress = this.context.r15;

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


let previousQuestProgress3 = '';
let questProgressSet3 = new Set();
let previousQuestProgressAddress3 = null;
(function () {
    const address =  getAddressPattern("questProgress3", '8b 40 18 ?? 03 c2 ?? 8b 3c 08 ?? 03 fa ?? 8b cf e8', 0x4d);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress3");

        const questProgressAddress = this.context.r15;

        setTimeout(() => {
            try {
                if (questProgressAddress.equals(previousQuestProgressAddress3.add(0x1))) {
                    previousQuestProgressAddress3 = questProgressAddress;
                    return;
                }
            }
            catch(e) {} 
            previousQuestProgressAddress3 = questProgressAddress;
            
            let questProgress3 = readString(questProgressAddress);
            
            if (previousQuestProgress3.includes(questProgress3)) 
                return;
            
            if (questProgressSet3.has(questProgress3))
                return;
            
            questProgressSet3.add(questProgress3);
            
            previousQuestProgress3 = questProgress3;
            thirdHandler(questProgress3);
        }, 30);
    });
})();


let previousQuestProgress4 = '';
let questProgressSet4 = new Set();
let previousQuestProgressAddress4 = null;
(function () {
    const address =  getAddressPattern("questProgress4", '8b 40 18 ?? 03 44 ?? ?? ?? 8b 7c 10 04', 0x4b);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // console.warn("in: questProgress4");

        const questProgressAddress = this.context.r15;

        setTimeout(() => {
            try {
                if (questProgressAddress.equals(previousQuestProgressAddress4.add(0x1))) {
                    previousQuestProgressAddress4 = questProgressAddress;
                    return;
                }
            }
            catch(e) {} 
            previousQuestProgressAddress4 = questProgressAddress;
            
            let questProgress4 = readString(questProgressAddress);
            
            if (previousQuestProgress4.includes(questProgress4)) 
                return;
            
            if (questProgressSet4.has(questProgress4))
                return;
            
            questProgressSet4.add(questProgress4);
            
            previousQuestProgress4 = questProgress4;
            thirdHandler(questProgress4);
        }, 30);
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
                    if(address.add(1).readU8() === 0x00) {
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