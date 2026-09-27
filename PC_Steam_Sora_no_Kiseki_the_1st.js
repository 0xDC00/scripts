// ==UserScript==
// @name         Sora no Kiseki the 1st / 空の軌跡 the 1st / Trails in the Sky 1st Chapter
// @version      1.07
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   GungHo
//
// https://store.steampowered.com/app/3375780/Trails_in_the_Sky_1st_Chapter/
// ==/UserScript==


// console.warn("Known issues: \n- In the STATUS tab in the main menu, selecting another character will extract the overdrive's, an S-Craft's and a support ability's description of that character.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '25+');

let isDebugging = true;


(function () {
    const address = getAddressPattern("name", 'e8 ?? ?? ?? ?? 8b 84 ?? ?? ?? ?? ?? ?? 85 f6 89 84');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "name");
    });
})();


(function () {
    const address = getAddressPattern("dialogue", 'e8 ?? ?? ?? ?? ?? 01 be');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "dialogue");
    });
})();


(function () {
    const address = getAddressPattern("choices", 'e8 ?? ?? ?? ?? ?? 8b 57 30 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "choices");
    });
})();


(function () {
    const address = getAddressPattern("terminalChoices", 'e8 ?? ?? ?? ?? 90 ?? 8b c3 ?? 8b 5c ?? ?? ?? 8b 6c ?? ?? ?? 8b 74 ?? ?? ?? 83 c4 40 5f c3');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "terminalChoices");
    });
})();


(function () {
    const address = getAddressPattern("activeVoice", 'e8 ?? ?? ?? ?? ?? 8b 83 a0 00 00 00 33');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "activeVoice");
    });
})();


(function () {
    const address = getAddressPattern("tutorial1", 'e8 ?? ?? ?? ?? 8b 46 40 ?? 88 3c 30 ?? 8b af 90');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        // processText(this.context.rdx, "third", "tutorial1");
        let tutorial1 = getDescription(this.context.rdx);
        tutorial1 = cleanText(tutorial1);
        thirdHandler(tutorial1);
    });
})();


// (function () {
//     const address = getAddressPattern("tutorial2", 'e8 ?? ?? ?? ?? 8b 87 40 03 00 00 0f ba e0 09 72 ?? 66 c7 87 e0 06 00 00 01 01 0f ba e8 09 89 87 40 03 00 00 ?? 8d');
//     if(!address)
//         return;
//     Interceptor.attach(address, function (args) {
//         processText(this.context.rdx, "third", "tutorial2");
//     });
// })();


(function () {
    const address = getAddressPattern("tutorial3", 'e8 ?? ?? ?? ?? 8b 83 40 03 00 00 0f ba e0 09 72 ?? 66 c7 83 e0 06 00 00 01 01 0f ba e8 09 89 83 40 03 00 00 0f 10 83 0c 01 00 00 0f 11 44 ?? ?? f3 ?? 0f 10 54 ?? 10');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial3");
    });
})();


(function () {
    const address = getAddressPattern("tutorial4", 'e8 ?? ?? ?? ?? 8b 83 40 03 00 00 0f ba e0 09 72 ?? 66 c7 83 e0 06 00 00 01 01 0f ba e8 09 89 83 40 03 00 00 0f 10 83 0c 01 00 00 0f 11 44 ?? ?? f3 ?? 0f 10 54 ?? 20');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial4");
    });
})();


// (function () {
//     const address = getAddressPattern("tutorial5", 'e8 ?? ?? ?? ?? 8b 97 40 03');
//     if(!address)
//         return;
//     Interceptor.attach(address, function (args) {
//         processText(this.context.rdx, "third", "tutorial5");
//     });
// })();


(function () {
    const address = getAddressPattern("tutorial6", '8b fd ?? 8b 54 ?? 08', 0xa, );
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial6");
    });
})();


(function () {
    const address = getAddressPattern("tutorial7", 'c7 87 50 03 00 00 00 00 00 00 ?? 8b cf ?? 8b 55 10', 0x11);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial7");
    });
})();


(function () {
    const address = getAddressPattern("tutorial8", 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 40 e8 ?? ?? ?? ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial8");
    });
})();


(function () { 
    const address = getAddressPattern("systemMessage1", 'e8 ?? ?? ?? ?? ?? 8b 8e 98 00 00 00 ba 1d 80 00 00 ?? 8b 01 ff 50 60 ?? 8b 8e 98 00 00 00 33 d2 e8 ?? ?? ?? ?? ?? 8b 85 d0 00 00 00 ?? 85 c0 75 ?? 0f 57 c9 0f 57 c0 eb ?? f3 0f 10 80 34 03 00 00 f3 0f 10 88 10 01 00 00 ?? 8b 0d');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "systemMessage1");
    });
})();


(function () { 
    const address = getAddressPattern("systemMessage2", 'e8 ?? ?? ?? ?? ?? 8b 8e 98 00 00 00 ba 1d 80 00 00 ?? 8b 01 ff 50 60 ?? 8b 8e 98 00 00 00 33 d2 e8 ?? ?? ?? ?? ?? 8b 85 d0 00 00 00 ?? 85 c0 75 ?? 0f 57 c9 0f 57 c0 eb ?? f3 0f 10 80 34 03 00 00 f3 0f 10 88 10 01 00 00 ?? 8b 05');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "systemMessage2");
    });
})();


let systemMessage3 = '';
(function () { 
    const address = getAddressPattern("systemMessage3", 'e8 ?? ?? ?? ?? 90 ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d ?? ?? c0 08 00 00 ?? 8b ?? ?? ?? 8b ?? ?? ?? 8b e3 ?? 5e');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "systemMessage3");
    });
})();


(function () {
    const address = getAddressPattern("menuDescription1", 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 4c ?? ?? ?? 33');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "menuDescription1");
    });
})();


(function () {
    const address = getAddressPattern("menuDescription2", 'e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "menuDescription2");
    });
})();


(function () {
    const address = getAddressPattern("orbmentSlotDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d ?? ?? 10');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.r11, "second", "orbmentSlotDescription");
    });
})();


let inventoryName = '';
(function () {
    const address = getAddressPattern("inventory", 'e8 ?? ?? ?? ?? 90 ?? 83 ff 04 0f 85');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        inventoryName = getName(this.context.rdx, "inventory");
    });
})();


(function () { 
    const address = getAddressPattern("inventoryDescription", '83 a0 bc 00 00 00 fe ?? 8d ?? ?? 30 ?? 8b 8b 10 01', 0x13);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "inventoryDescription");
    });
})();


(function () { 
    const address = getAddressPattern("shopInventoryDescription", 'e8 ?? ?? ?? ?? 90 eb ?? ?? 8b fb ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "shopInventoryDescription");
    });
})();


(function () { 
    const address = getAddressPattern("quartzDescription", '74 ?? ?? 8d ?? ?? 30 e8 ?? ?? ?? ?? 90', 0x7);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "quartzDescription");
    });
})();


(function () { // During battle
    const address = getAddressPattern("itemDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 50 08 00 00 5f c3 cc cc cc cc cc cc cc cc cc cc ?? 8d 05');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "itemDescription");
    });
})();


(function () {
    const address = getAddressPattern("statusDescription", '74 ?? ?? 8b 85 a8 00 00 00 ?? 8d', 0x15);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        let statusName = getName(this.context.r8, "status");
        let statusDescription = processText(this.context.rdi, "NH", "statusDescription1");
        processText(this.context.r8, "second", "statusDescription2", statusName, statusDescription);
    });
})();


(function () {
    const address = getAddressPattern("overdriveDescription", 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 40 ?? 8b cb e8 ?? ?? ?? ?? ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "overdriveDescription");
    });
})();


(function () {
    const address = getAddressPattern("supportAbilityDescription", 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? cc cc cc cc cc cc cc cc cc ?? 89');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        let supportAbilityName = getName(this.context.rdx, "supportAbility");
        processText(this.context.rdx, "second", "supportAbilityDescription", supportAbilityName);
    });
})();


(function () { 
    const address = getAddressPattern("tips", 'e8 ?? ?? ?? ?? ?? 8b 57 30 ?? 8b 8b a0');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        let tipsDescription = getDescription(this.context.rdx);
        tipsDescription = cleanText(tipsDescription);
        processText(this.context.rdx, "main", "tips", tipsDescription);
    });
})();


(function () { 
    const address = getAddressPattern("handbookTips", 'e8 ?? ?? ?? ?? 8b 87 40 03 00 00 0f ba e0 09 72 ?? 66 c7 87 e0 06 00 00 01 01 0f ba e8 09 89 87 40 03 00 00 ?? 8b 85 a8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        let handbookTipsDescription = getDescription(this.context.rdx);
        handbookTipsDescription = cleanText(handbookTipsDescription);
        processText(this.context.rdx, "second", "handbookTips", handbookTipsDescription);
    });
})();


(function () { 
    const address = getAddressPattern("loadingTips", 'e8 ?? ?? ?? ?? ?? 8b 57 30 ?? 8b 4d 30 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        let loadingTipsDescription = getDescription(this.context.rdx);
        loadingTipsDescription = cleanText(loadingTipsDescription);
        processText(this.context.rdx, "second", "loadingTips", loadingTipsDescription);
    });
})();


(function () { 
    const address = getAddressPattern("locationName1", 'e8 ?? ?? ?? ?? ?? 8b 4b 60 ?? 85 c9 74 ?? ?? 63 43 54 ?? b8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "locationName1");
    });
})();


(function () { 
    const address = getAddressPattern("locationName2", 'e8 ?? ?? ?? ?? ?? 8b 83 98 00 00 00 ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "locationName2");
    });
})();


(function () {
    const address = getAddressPattern("questNameBoard", 'e8 ?? ?? ?? ?? 8b 43 44 83 e8 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questNameBoard");
    });
})();


(function () {
    const address = getAddressPattern("questDescriptionBoard", 'e8 ?? ?? ?? ?? ?? bd 00 01 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questDescriptionBoard");
    });
})();


(function () {
    const address = getAddressPattern("questNameHandbook", 'e8 ?? ?? ?? ?? 8b 46 44');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questNameHandbook");
    });
})();


(function () {
    const address = getAddressPattern("questDescriptionHandbook", 'e8 ?? ?? ?? ?? ?? 8b 8e f8 00 00 00 8b d5 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questDescriptionHandbook");
    });
})();


(function () {
    const address = getAddressPattern("questProgressHandbook", 'e8 ?? ?? ?? ?? 90 ?? 8b 5c ?? ?? eb ?? 33');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questProgressHandbook");
    });
})();


(function () {
    const address = getAddressPattern("questCompletionNoteHandbook", 'e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 d0 00 00 00 ?? 5f ?? 5e ?? 5d ?? 5c 5f 5e 5d c3 cc');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questCompletionNoteHandbook");
    });
})();


(function () {
    const address = getAddressPattern("book", 'e8 ?? ?? ?? ?? ?? 8b 46 08 ?? 8b 80 a8 00 00 00 ?? 8b 98 58 02');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "book");
    });
})();


(function () { // Memo
    const address = getAddressPattern("enemyName1", 'e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b ce e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b ce e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyName1");
    });
})(); 


(function () { // In battles
    const address = getAddressPattern("enemyName2", 'e8 ?? ?? ?? ?? ?? 8b d0 ?? 8b cf e8 ?? ?? ?? ?? ?? 8b 9d', 0xb);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyName2");
    });
})();


(function () {
    const address = getAddressPattern("enemyMemo", 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyMemo");
    });
})(); 


(function () {
    const address = getAddressPattern("enemyDescription", 'e8 ?? ?? ?? ?? eb ?? ?? 8d 15 ?? ?? ?? ?? ?? 8b cf e8 ?? ?? ?? ?? eb ?? 83');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyDescription");
    });
})();


(function () {
    const address = getAddressPattern("achievements", 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 f8 01 0f 85 ?? ?? ?? ?? ?? 8b 81 40 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        let achievementsName = getName(this.context.rdx, "achievements");
        processText(this.context.rdx, "second", "achievements", achievementsName);
    });
})();


(function () { 
    const address = getAddressPattern("optionDescription", 'e8 ?? ?? ?? ?? ?? bf fe ff ff ff');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "optionDescription");
    });
})();


(function () { 
    const address = getAddressPattern("difficultyDescription", 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? ?? 8d 4b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "difficultyDescription");
    });
})();


(function () { // Craft and arts description in battle
    const address = getAddressPattern("attackDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 50 08 00 00 5f c3 cc cc cc cc cc cc cc cc cc cc cc cc cc');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "attackDescription");
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


let currentItemDescription = '';
function processText(context, handler, name, extraText1, extraText2) {
    if(isDebugging)
        console.warn(`Processing ${name}'s text`);

    const address = context;
    let text = '';

    if (name === "dialogue") { 
        // Dialogue gets called before name. 
        text = address.readUtf8String();
        text = cleanText(text);

        setTimeout(() => {
            if (text.length === 0 || systemMessage3.includes(text))
                    return;

            mainHandler(text);
        }, 20);
        return;
    }

    else if (name === "tutorial7") {
        text = address.readUtf8String();
        setTimeout(() => {
            text = cleanText(text);
            thirdHandler(text);
        }, 20);
        return;
    }

    else 
        text = address.readUtf8String();
    
    text = cleanText(text);

    switch(name) {
        case "inventoryDescription":
        case "shopInventoryDescription":
        case "quartzDescription":
        case "itemDescription":
            text = inventoryName + '\n' + text;
            break;

        case "statusDescription2":
            text = extraText1 + '\n' + extraText2 + '\n' + text;
            break;

        case "tips":
        case "handbookTips":
        case "loadingTips":
            text = text + '\n' + extraText1;
            break;

        case "questDescriptionBoard":
        case "questProgressHandbook":
            text = '\n' + text; 
            break;

        case "questDescriptionHandbook":
            text = "\n" + text + "\n" + "----------------------------";
            break;

        case "questCompletionNoteHandbook":
            text = "\n----------------------------\n" + text;
            break;

        case "enemyName1":
        case "enemyName2":
        case "tutorial4":
        case "tutorial8": 
            text = text + '\n';
            break;

        case "achievements":
        case "supportAbilityDescription":
            text = extraText1 + '\n' + text;
            break;

        default:
            break;
    }

    if (text.length === 0)
        return;

    if(name === "systemMessage3")
        systemMessage3 = text;

    switch(handler) {
        case "main":
            mainHandler(text);
            break;
    
        case "second":
            secondHandler(text);
            break;

        case "third":
            thirdHandler(text);
            break;
    
        case "NH": // No Handler
            return text;

        default: 
            return;
    }
}


const decoder = new TextDecoder('utf-8');
function getName(address, hookName) {
    if(isDebugging)
        console.warn(`Getting ${hookName}'s text`);

    let bytes = [];

    if (hookName === "status") {
        // Read bytes backwards to get the name of the craft after the first occurrence of null bytes
        let nullCount = 0;
        address = address.sub(2);

        while (nullCount < 2) {
            let byte = address.readU8();

            if (nullCount === 1 && byte !== 0x00) 
                bytes.push(byte);
            
            if (byte === 0x00) 
                nullCount++;
            
            address = address.sub(1);
        }

        bytes.reverse(); 
    }
    
    else  { 
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
    }

    return decoder.decode(Uint8Array.from(bytes));
}


function getDescription(address) {
    if(isDebugging)
        console.warn(`Getting description text`);
    
    let bytes = [];
    let nullCount = 0;

    // Skip name, read description
    while (nullCount < 2) { 
        while (address.readU8()) {
            if(nullCount === 0) {
                address = address.add(1);
                continue;
            }

            let byte = address.readU8();
            bytes.push(byte);
            address = address.add(1);
        }

        nullCount++;

        address = address.add(1);
    }

    return decoder.decode(Uint8Array.from(bytes));
}


function cleanText(text) {
    return text
        .replace(/<[^<>]*>/g, '')
        .replace(/%[a-zA-Z0-9]*(?:\.[0-9]+)?[a-zA-Z]/g, ' ')
        .replace(/[a-z][0-9]+/g, '')
        .replace(/^\s*$/gm, '')
        .trim();
}