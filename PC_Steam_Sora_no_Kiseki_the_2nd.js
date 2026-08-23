// ==UserScript==
// @name         Sora no Kiseki the 2nd / 空の軌跡 the 2nd / Trails in the Sky 2nd Chapter
// @version      DEMO
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   Nihon Falcom, GungHo, Clouded Leopard Entertainment
//
// https://store.steampowered.com/app/4225980/Trails_in_the_Sky_2nd_Chapter/
// ==/UserScript==


console.warn("Know issues: \n- The first quartz's name won't have its name extracted when you open an orbment.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send((s) => s, '200+');
const secondHandler = trans.send((s) => s, 200);
const thirdHandler = trans.send((s) => s, '25+');

let isDebugging = false;


(function () {
    const address = getAddressPattern("name1", 'e8 ?? ?? ?? ?? ?? 8b 86 00 01 00 00 ?? 8b 80 70 03 00 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "name1");
    });
})();


(function () {
    const address = getAddressPattern("name2", 'e8 ?? ?? ?? ?? ?? 8b 8b e0 00 00 00 ?? 81');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "name2");
    });
})();


(function () {
    const address = getAddressPattern("dialogue", 'e8 ?? ?? ?? ?? ?? 01 be');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "dialogue");
    });
})();


(function () {
    const address = getAddressPattern("pokerDialogue1", 'e8 ?? ?? ?? ?? ?? 8d 8d 80 07 00 00 ba 08 00 00 00 0f 1f 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "pokerDialogue1");
    });
})();


(function () {
    const address = getAddressPattern("pokerDialogue2", 'e8 ?? ?? ?? ?? ?? 8d 8d 80 07 00 00 ba 08 00 00 00 66 66 0f 1f 84');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "pokerDialogue2");
    });
})();


(function () {
    const address = getAddressPattern("pokerDialogue3", '90 8b 83 a8 03 00 00 83 f8 0a 0f 85 ?? ?? ?? ?? ?? 8b 8b 08 02 00 00 ?? 8b d4 ?? 8b 41 34 ?? 8b 79 20 ?? 8d 04 80 ?? 03 c0', 0x8e);
    Interceptor.attach(address, function (args) {
        let winType = processText(this.context.r8, "NH");
        processText(this.context.rdx, "main", "pokerDialogue3", winType);
    });
})(); 


(function () {
    const address = getAddressPattern("blackJackDialogue1", 'e8 ?? ?? ?? ?? ?? 8d 8d 80 07 00 00 ba 08 00 00 00 66 90 0f 10 00 0f');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "blackJackDialogue1");
    });
})();


(function () {
    const address = getAddressPattern("blackJackDialogue2", 'e8 ?? ?? ?? ?? ?? 8d 8d 80 07 00 00 ba 08 00 00 00 90 0f 10');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "blackJackDialogue2");
    });
})();


(function () {
    const address = getAddressPattern("rouletteJackDialogue1", 'e8 ?? ?? ?? ?? ?? 8d 8d 70 03 00 00 ?? b8 08');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "rouletteJackDialogue1");
    });
})();


(function () {
    const address = getAddressPattern("choices", 'e8 ?? ?? ?? ?? ?? 8b 57 30 8b');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "choices");
    });
})();


(function () {
    const address = getAddressPattern("activeVoice", 'e8 ?? ?? ?? ?? ?? 8b 83 a0 00 00 00 33');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "activeVoice");
    });
})();


(function () {
    const address = getAddressPattern("tutorial1", 'e8 ?? ?? ?? ?? ?? 8b 07 ?? 88 24 03 c7 44');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial1");
    });
})();


(function () {
    const address = getAddressPattern("tutorial2", 'e8 ?? ?? ?? ?? 8b 87 e8 02 00 00 0f ba e0 09 72 ?? 66 c7 87 88 06 00 00 01 01 0f ba e8 09 89 87 e8 02 00 00 ?? 8d');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial2");
    });
})();


(function () {
    const address = getAddressPattern("tutorial3", 'e8 ?? ?? ?? ?? 8b 83 e8 02 00 00 0f ba e0 09 72 ?? 66 c7 83 88 06 00 00 01 01 0f ba e8 09 89 83 e8 02 00 00 0f 10 83 f0 00 00 00 0f 11 44 ?? ?? f3 ?? 0f 10 54 ?? 10');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial3");
    });
})();


(function () {
    const address = getAddressPattern("tutorial4", 'e8 ?? ?? ?? ?? 8b 83 e8 02 00 00 0f ba e0 09 72 ?? 66 c7 83 88 06 00 00 01 01 0f ba e8 09 89 83 e8 02 00 00 0f 10 83 f0 00 00 00 0f 11 44 ?? ?? f3 ?? 0f 10 54 ?? 20');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial4");
    });
})();


(function () {
    const address = getAddressPattern("tutorial5", 'e8 ?? ?? ?? ?? 8b 97 e8 02 00 00 0f ba e2 09 72 ?? 66 c7 87 88 06 00 00 01 01 0f ba ea 09 ?? b8');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial5");
    });
})();


(function () {
    const address = getAddressPattern("tutorial6", '75 ?? ?? 8b f4 ?? 89 a6 f8 02 00 00 ?? 8b ce ?? 8b 56 10 e8', 0x13);
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial6");
    });
})();


(function () {
    const address = getAddressPattern("helpTips", 'e8 ?? ?? ?? ?? 8b 87 e8 02 00 00 0f ba e0 09 72 ?? 66 c7 87 88 06 00 00 01 01 ?? 8b 5c');
    Interceptor.attach(address, function (args) {
        let helpTipsName = getName(this.context.rdx, "helpTips");
        processText(this.context.rdx, "second", "helpTips", helpTipsName);
    });
})();


let systemMessage = '';
(function () { 
    const address = getAddressPattern("systemMessage", 'e8 ?? ?? ?? ?? ?? 8b 8b c8 00 00 00 ?? 8b d7');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdi, "second", "systemMessage");
    });
})();


(function () { 
    const address = getAddressPattern("pokerRules", 'e8 ?? ?? ?? ?? eb ?? ?? 8b 53 08 ?? 8d ?? ?? 70 e8 ?? ?? ?? ?? ?? b8 ec 13 00 00 ?? 8b d0 ?? 8d ?? e0 27 00 00 e8 ?? ?? ?? ?? ?? 8d ?? e0 27 00 00 ?? 8b cf e8 ?? ?? ?? ?? ?? 8b 95 08 02 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "pokerRules");
    });
})();


(function () { 
    const address = getAddressPattern("blackJackRules1", 'e8 ?? ?? ?? ?? eb ?? ?? 8b 53 08 ?? 8d ?? ?? 70 e8 ?? ?? ?? ?? ?? b8 ec 13 00 00 ?? 8b d0 ?? 8d ?? e0 27 00 00 e8 ?? ?? ?? ?? ?? 8d ?? e0 27 00 00 ?? 8b cf e8 ?? ?? ?? ?? ?? 8b 95 88 01 00 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "blackJackRules1");
    });
})();


(function () { 
    const address = getAddressPattern("blackJackRules2", '8b c0 c6 84 05 f0 13 00 00 00 80 7b 10 00 0f 84 ?? ?? ?? ?? ?? 8b 85 38 05 00 00', 0xb2);
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "blackJackRules2");
    });
})();


(function () { 
    const address = getAddressPattern("rouletteRules", 'e8 ?? ?? ?? ?? eb ?? ?? 8b 53 08 ?? 8d ?? ?? 70 e8 ?? ?? ?? ?? ?? b8 ec 13 00 00 ?? 8b d0 ?? 8d ?? f0 13 00 00 e8 ?? ?? ?? ?? ?? 8b 87 18 03 00 00 ?? 8d ?? f0 13 00 00 ?? 3b c1 0f 84 ?? ?? ?? ?? ?? 85 c0 74 ?? ?? 8d ?? f0 13 00 00 ?? 2b c0 66 66 66 0f 1f 84 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "rouletteRules");
    });
})();


(function () {
    const address = getAddressPattern("menuDescription1", 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 4c ?? ?? ?? 33');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "menuDescription1");
    });
})();


(function () {
    const address = getAddressPattern("menuDescription2", 'e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b cb e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "menuDescription2");
    });
})();


(function () {
    const address = getAddressPattern("orbmentSlotDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d ?? ?? 10');
    Interceptor.attach(address, function (args) {
        processText(this.context.r11, "second", "orbmentSlotDescription");
    });
})();


let inventoryName = '';
let gotInventoryName = false;
(function () { 
    const address = getAddressPattern("inventoryName", 'e8 ?? ?? ?? ?? 85 c0 b9 ff ff ff ff 0f 48 c1 89 87 00 08 00 00');
    Interceptor.attach(address, function (args) {
        // The hook gets called a few times when selecting an item. Disregarding subsequent calls.
        if(!gotInventoryName) {
            inventoryName = getName(this.context.rbx, "inventoryName");
            gotInventoryName = true;
        }
    });
})();


(function () { 
    const address = getAddressPattern("inventoryDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 50 08 00 00 5f c3 cc cc cc cc cc cc ?? 89');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "inventoryDescription");
    });
})();


(function () { 
    const address = getAddressPattern("shopInventoryDescription", 'e8 ?? ?? ?? ?? 90 c6 44 ?? 60 00 eb');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "shopInventoryDescription");
    });
})();


(function () { 
    const address = getAddressPattern("itemGetName", 'e8 ?? ?? ?? ?? 90 ?? 8b d0 ?? 8b cf e8 ?? ?? ?? ?? 90 ?? 8b 9f 28 02 00 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.r8, "main", "itemGetName");
    });
})();


(function () { 
    const address = getAddressPattern("itemGetDescription", 'e8 ?? ?? ?? ?? ?? 8b 87 18 03 00 00 c6 04 03 00 ?? 8b cf f6 87 e8 02 00 00 04 74 ?? ?? 89 a7 78 03 00 00 ?? 89 a7 30 03 00 00 e8 ?? ?? ?? ?? eb ?? e8 ?? ?? ?? ?? c6 87 88 06 00 00 01 e9');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "itemGetDescription");
    });
})(); 


(function () { // In battles
    const address = getAddressPattern("itemDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 50 08 00 00 5f c3 cc cc cc');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "itemDescription");
    });
})();


(function () { // Craft and arts description in battles
    const address = getAddressPattern("attackDescription", 'e8 ?? ?? ?? ?? 90 ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 60');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "attackDescription");
    });
})();


let statusName = '';
(function () { // And art names
    const address = getAddressPattern("statusName", 'e8 ?? ?? ?? ?? ?? 8b f0 ba 00 08 00 00 ?? 8b c8 e8 ?? ?? ?? ?? ?? 8b d8 8b 97 00 08 00 00 03 d0 81 fa 00 08 00 00 72 ?? ?? 8d 0d ?? ?? ?? ?? ?? b8 42 01 00 00 ?? 8d 15 ?? ?? ?? ?? ?? 8b cd e8 ?? ?? ?? ?? eb ?? ?? 8b c3 ?? 8b d6 ?? 8b cf e8 ?? ?? ?? ?? 01 9f 00 08 00 00 e9');
    Interceptor.attach(address, function (args) {
        statusName = getName(this.context.r8, "status");
    });
})();


(function () { // And art descriptions
    const address = getAddressPattern("statusDescription", 'e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 89 5c');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "statusDescription");
    });
})();


let statusOverdriveName = '';
(function () { 
    const address = getAddressPattern("statusOverdriveName", 'e8 ?? ?? ?? ?? ?? 8d ?? b0 07 00 00 b9 08 00 00 00 0f 10 00');
    Interceptor.attach(address, function (args) {
        statusOverdriveName = getName(this.context.r8, "statusOverdriveName");
    });
})();


(function () { 
    const address = getAddressPattern("statusOverdriveDescription", 'e8 ?? ?? ?? ?? 90 ?? 8d ?? 60 03 00 00');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "statusOverdriveDescription");
    });
})();


(function () { 
    const address = getAddressPattern("supportAbilityDescription", 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? cc cc cc cc cc cc cc cc cc ?? 53 ?? 83 ec 60 0f 29 74');
    Interceptor.attach(address, function (args) {
        let supportAbilityName = getName(this.context.rdx, "supportAbilityDescription");
        processText(this.context.rdx, "second", "supportAbilityDescription", supportAbilityName);
    });
})();


(function () { 
    const address = getAddressPattern("popUpTips", 'e8 ?? ?? ?? ?? ?? 8b 57 30 ?? 8b 8b a0');
    Interceptor.attach(address, function (args) {
        let tipsDescription = getDescription(this.context.rdx);
        tipsDescription = cleanText(tipsDescription);
        processText(this.context.rdx, "main", "popUpTips", tipsDescription);
    });
})();


(function () { 
    const address = getAddressPattern("loadingTips", 'e8 ?? ?? ?? ?? ?? 8b 57 30 ?? 8b 4f 30 e8');
    Interceptor.attach(address, function (args) {
        let loadingTipsDescription = getDescription(this.context.rdx);
        loadingTipsDescription = cleanText(loadingTipsDescription);
        processText(this.context.rdx, "main", "loadingTips", loadingTipsDescription);
    });
})();


(function () { 
    const address = getAddressPattern("locationName1", 'e8 ?? ?? ?? ?? ?? 8b 4b 60 ?? 85 c9 74 ?? ?? 63 43 54 ?? b8');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "locationName1");
    });
})();


(function () { 
    const address = getAddressPattern("locationName2", 'e8 ?? ?? ?? ?? ?? 8b 83 98 00 00 00 ?? 8b 93 90 00 00 00 8b 88 70');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "locationName2");
    });
})();


(function () { 
    const address = getAddressPattern("mapLocationName", 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 20 e8 ?? ?? ?? ?? ?? 8d ?? ?? 20');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "mapLocationName");
    });
})();


(function () { 
    const address = getAddressPattern("mapObjective", 'e8 ?? ?? ?? ?? 90 e9 ?? ?? ?? ?? ?? 8b 56 38');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "mapObjective");
    });
})();


(function () {
    const address = getAddressPattern("questNameBoard", 'e8 ?? ?? ?? ?? 8b 43 44 83 e8 01');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questNameBoard");
    });
})();


(function () {
    const address = getAddressPattern("questDescriptionBoard", 'e8 ?? ?? ?? ?? ?? bd 00 01 00 00 ?? 8d');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questDescriptionBoard");
    });
})();


(function () {
    const address = getAddressPattern("questNameHandbook", 'e8 ?? ?? ?? ?? 8b 45 44 ?? 8b 5c ?? ?? c7 44 ?? ?? 49');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questNameHandbook");
    });
})(); 


(function () {
    const address = getAddressPattern("questDescriptionHandbook", 'e8 ?? ?? ?? ?? ?? 8b 8e 00 01 00 00 8b d7 e8');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questDescriptionHandbook");
    });
})(); 


(function () {
    const address = getAddressPattern("questProgressHandbook", 'e8 ?? ?? ?? ?? 90 8b 5c ?? ?? eb ?? 33 ff eb');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questProgressHandbook");
    });
})(); 


(function () {
    const address = getAddressPattern("questCompletionNoteHandbook", 'e8 ?? ?? ?? ?? ?? 8b 8c ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 d0 00 00 00 ?? 5f ?? 5e ?? 5d ?? 5c 5f 5e 5d c3 cc cc cc');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "questCompletionNoteHandbook");
    });
})();


(function () { 
    const address = getAddressPattern("book", 'e8 ?? ?? ?? ?? ?? 8b 46 08 ?? 8b 80 a8 00 00 00 ?? 8b 98 28 02 00 00 ?? 8b 80 30 02 00 00 ?? 8d 3c c3');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "book");
    });
})(); 


(function () { // Memo
    const address = getAddressPattern("enemyName1", 'e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b ce e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b ce e8 ?? ?? ?? ?? ?? 8b d7 ?? 8b');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyName1");
    });
})(); 


(function () { // In battles
    const address = getAddressPattern("enemyName2", 'e8 ?? ?? ?? ?? ?? 8b 9f 28 02 00 00 ?? 8b 87 30 02 00 00 ?? 8d 34 c3 ?? 3b de 74 ?? 66 0f 1f 84 00 00 00 00 00 ?? 8b 0b ?? 8d 15 ?? ?? ?? ?? ?? b1 01 ?? b8 fe ff ff 7f');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyName2");
    });
})(); 


(function () {
    const address = getAddressPattern("enemyMemo", 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 8b');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyMemo");
    });
})(); 


(function () { // In battles
    const address = getAddressPattern("enemyDescription", 'e8 ?? ?? ?? ?? eb ?? ?? 8d 15 ?? ?? ?? ?? ?? 8b ce e8 ?? ?? ?? ?? eb');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "enemyDescription");
    });
})(); 


(function () {
    const address = getAddressPattern("fishName", 'e8 ?? ?? ?? ?? ?? 8b 9f 28 02 00 00 ?? 8b 87 30 02 00 00 ?? 8d 34 c3 ?? 3b de 74 ?? 0f 1f 44 00 00 ?? b1 01 ?? 33 c0');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "fishName");
    });
})(); 


(function () {
    const address = getAddressPattern("fishDescription", 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 81 c4 f0 00 00 00 ?? 5f ?? 5e ?? 5d ?? 5c 5f 5e 5d c3 cc cc cc cc cc ?? 83 ec 28 ?? 89 5c');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "fishDescription");
    });
})(); 


(function () {
    const address = getAddressPattern("achievements", 'e8 ?? ?? ?? ?? e9 ?? ?? ?? ?? 83 f8 01 0f 85 ?? ?? ?? ?? ?? 8b 81 40 01');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "achievements");
    });
})();


(function () { 
    const address = getAddressPattern("optionDescription", 'e8 ?? ?? ?? ?? ?? bf fe ff ff ff');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "optionDescription");
    });
})();


(function () { 
    const address = getAddressPattern("difficultyDescription", 'e8 ?? ?? ?? ?? ?? 8b 7c ?? ?? ?? 8d 4b 18 0f 28 ce e8 ?? ?? ?? ?? ?? 8b 43 08 f3 0f 10 4b 20 0f 28 74');
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "difficultyDescription");
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


function processText(context, handler, name, extraText) {
    if(isDebugging)
        console.warn(`Processing ${name}'s text`);

    const address = context;
    let text = '';

    if (name === "dialogue" || name === "pokerDialogue1" || name === "pokerDialogue2" || name === "pokerDialogue3" || name === "blackJackDialogue1" || name === "blackJackDialogue2" || name === "rouletteJackDialogue1") {
        // Dialogue gets called before name. 
        setTimeout(() => {
            text = address.readUtf8String();
            text = cleanText(text);

            if (text.length === 0 || systemMessage.includes(text))
                return;

            if (name === "pokerDialogue3")
                mainHandler(extraText + text);
            else
                mainHandler(text);
            
            return;
        }, 20);
    }

    else if(name === "tutorial5" || name === "tutorial6") {
        // To print out the text in the same order as shown on screen.
        setTimeout(() => {
            text = address.readUtf8String();
            text = cleanText(text);

            if (text.length === 0)
                return;

            thirdHandler('\n' + text);
            return;
        }, 20);
    }

    else 
        text = address.readUtf8String();
    
    text = cleanText(text);

    switch(name) {
        case "tutorial1":
        case "questDescriptionBoard":
        case "tutorial2":
        case "mapObjective":
        case "enemyMemo":
        case "enemyDescription":
            if (text === '')
                break;

            text = '\n' + text;
            break;

        case "helpTips":
        case "supportAbilityDescription":
            text = extraText + '\n' + text;
            break;

        case "inventoryDescription":
        case "shopInventoryDescription":
        case "itemDescription":
            text = inventoryName + '\n' + text;
            gotInventoryName = false;
            break;

        case "statusOverdriveDescription":
            text = statusOverdriveName + '\n' + text;
            break;

        case "popUpTips":
        case "loadingTips":
            text = text + '\n' + extraText;
            break;

        case "questDescriptionHandbook":
            text = '\n' + text + "\n----------------------------\n";

        case "questCompletionNoteHandbook":
            if (text === '')
                return;

            text = "\n----------------------------\n" + text;
            break;

        case "statusDescription":
            text = statusName + '\n' + text;
            break;

        default:
            break;
    }

    if (text.length === 0)
        return;

    if(name === "systemMessage")
        systemMessage = text;

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

    else if (hookName === "statusOverdriveName") {
        // Skip unnecessary text until reaching the overdrive name
        let nullCount = 0;

        while (nullCount < 7) { 
            while (address.readU8()) {
                if(nullCount === 0) {
                    address = address.add(1);
                    continue;
                }

                let byte = address.readU8();

                if (nullCount === 6)
                    bytes.push(byte);
                
                address = address.add(1);
            }

            nullCount++;
            address = address.add(1);
        }

    }
    
    else  { 
        // Read bytes backwards to get the item name
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
        .replace(/[a-z][0-9]+/g, ' ')
        .replace(/^\s*$/gm, '')
        .trim();
}