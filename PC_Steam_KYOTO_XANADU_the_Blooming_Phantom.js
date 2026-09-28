// ==UserScript==
// @name         KYOTO XANADU -the Blooming Phantom- / 亰都ザナドゥ -桜花幻舞-
// @version      1.04
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Nihon Falcom
// * publisher   Nihon Falcom, Clouded Leopard Entertainment 
//
// https://store.steampowered.com/app/4449410/KYOTO_XANADU_the_Blooming_Phantom/
// ==/UserScript==


console.warn("Kown issues: \n- The description of a difficulty will be extracted when arriving on the title screen.");
console.warn("- When opening the bestiary or changing tab in it, an additional extraction occurs.");


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, '25+');
const thirdHandler = trans.send(s => s, 200);

let isDebugging = false;


(function () {
    const address = getAddressPattern('name', 'e8 ?? ?? ?? ?? ?? 8b 9e 80 01 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "name");
    });
})();


(function () { 
    const address = getAddressPattern('dialogue', 'e8 ?? ?? ?? ?? 89 9f 48 03');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "dialogue");
    });
})();


(function () { 
    const address = getAddressPattern('cutsceneSubtitle', 'e8 ?? ?? ?? ?? 90 ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d ?? ?? d0 08 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "cutsceneSubtitle");
    });
})();


(function () { 
    const address = getAddressPattern('activeVoiceName', 'e8 ?? ?? ?? ?? ?? 8b 8b c0 01 00 00 8b 81 30 02');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "activeVoiceName");
    });
})();


(function () { 
    const address = getAddressPattern('activeVoiceDialogue', 'e8 ?? ?? ?? ?? ?? 8b 93 b8 01 00 00 ?? 8d');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "activeVoiceDialogue");
    });
})();


(function () { // At the start of the game when asked a few questions in a row
    const address = getAddressPattern('choices1', 'e8 ?? ?? ?? ?? ?? 8b 57 30 8b 8a c8 03');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "choices1");
    });
})();


(function () { 
    const address = getAddressPattern('choices2', 'e8 ?? ?? ?? ?? ?? 8b 47 18 ?? 8b 58 28 ?? 85');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "choices2");
    });
})();


(function () { 
    const address = getAddressPattern('backgroundNPCDialogue', 'e8 ?? ?? ?? ?? ?? 8b 8f 48 01 00 00 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "backgroundNPCDialogue");
    });
})(); 


(function () { 
    const address = getAddressPattern('backgroundNPCName', 'e8 ?? ?? ?? ?? 8b 8f 28 01 00 00 85 c9 74');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "backgroundNPCName");
    });
})(); 


(function () { // On solid blue background
    const address = getAddressPattern('systemMessage1', 'e8 ?? ?? ?? ?? ?? 85 c0 ?? 8b f8 74');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "systemMessage1");
    });
})();


(function () { // When asked to do something during a tutorial
    const address = getAddressPattern('systemMessage2', 'ff 50 60 ?? 8b 8f a8 00 00 00 ?? 8b', 0x3f);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "systemMessage2");
    });
})();


(function () { // Confirmation prompt when leaving a Xanadu labyrinth
    const address = getAddressPattern('systemMessage3', 'e8 ?? ?? ?? ?? 89 84 ?? ?? ?? ?? ?? 85 c0 74 ?? ?? 8d ?? ?? 30 ?? 3b cb 74');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rcx, "main", "systemMessage3");
    });
})();


(function () { 
    const address = getAddressPattern('location1', '75 ?? ?? 83 f8 01 0f 86');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "location1");
    });
})(); 


(function () { 
    const address = getAddressPattern('location2', '74 ?? ?? 8b 8f 18 02 00 00 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "location2");
    });
})(); 


(function () { 
    const address = getAddressPattern('nextLocation', 'e8 ?? ?? ?? ?? ?? 8b 83 a8 01 00 00 8b 88 c8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "nextLocation");
    });
})(); 


(function () { 
    const address = getAddressPattern('newObjective', 'e8 ?? ?? ?? ?? ?? 8b cd e8 ?? ?? ?? ?? 0f');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "newObjective");
    });
})();


(function () { // On a solid blue background
    const address = getAddressPattern('tutorial1', 'e8 ?? ?? ?? ?? ?? 8b 87 58 01 00 00 0f bf 50 1c');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "tutorial1");
    });
})();


(function () { // On a transparent black background
    const address = getAddressPattern('tutorial2Name', 'e8 ?? ?? ?? ?? ?? 8b 4f 28 ?? 8b 47 38 f3 0f');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "tutorial2Name");
    });
})();


(function () { // On a transparent black background
    const address = getAddressPattern('tutorial2Description', 'e8 ?? ?? ?? ?? ?? 8b 4f 30 ?? 8b 47 38 f3 0f 10 48 4c');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "tutorial2Description");
    });
})();


(function () { // Selecting the Help tab from the pause menu
    const address = getAddressPattern('helpCategory', 'e8 ?? ?? ?? ?? ?? 8b 57 10 ?? 8b 4e 20 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "helpCategory");
    });
})();


(function () { // Selecting the Help tab from the pause menu
    const address = getAddressPattern('helpName', 'e8 ?? ?? ?? ?? ?? 8b 4e 30 0f b6');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "helpName");
    });
})();


(function () { // Selecting the Help tab from the pause menu
    const address = getAddressPattern('helpDescription', 'e8 ?? ?? ?? ?? ?? 8b 44 ?? ?? ?? 88 34 03 ?? 8d ?? ?? 38');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "helpDescription");
    });
})();


(function () {
    const address = getAddressPattern('inventoryName', 'e8 ?? ?? ?? ?? ?? 8b 77 20 ?? 85');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "inventoryName");
    });
})(); 


(function () {
    const address = getAddressPattern('inventoryDescription', 'e8 ?? ?? ?? ?? ?? 8b 47 60 ?? 85 c0 74 ?? 83');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "inventoryDescription");
    });
})();


(function () {
    const address = getAddressPattern('inventoryEffect1', 'e8 ?? ?? ?? ?? ?? 8b 8c de f8 00 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "inventoryEffect1");
    });
})(); 


(function () {
    const address = getAddressPattern('inventoryEffect2', 'e8 ?? ?? ?? ?? ?? 8b 46 60 83 a0 bc');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "inventoryEffect2");
    });
})(); 


(function () {
    const address = getAddressPattern('DLCinventoryName', 'e8 ?? ?? ?? ?? ?? 8b 4e 28 ?? 85 c9 74 ?? ?? 8b 53 30 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "DLCinventoryName");
    });
})(); 


(function () {
    const address = getAddressPattern('DLCinventoryDescription', 'e8 ?? ?? ?? ?? ?? 8b 46 50 ?? 85');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "DLCinventoryDescription");
    });
})(); 


(function () { 
    const address = getAddressPattern('difficulty', 'e8 ?? ?? ?? ?? ?? 8b 4c ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 83 c4 40 5f c3 cc cc cc cc cc cc cc cc ?? 89 5c');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "difficulty");
    });
})();


(function () { 
    const address = getAddressPattern('optionDescription', 'e8 ?? ?? ?? ?? ?? 21 a6 bc');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "optionDescription");
    });
})();


(function () { 
    const address = getAddressPattern('characterName', 'e8 ?? ?? ?? ?? ?? 8b 17 ?? 8b 52 28 ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "characterName");
    });
})(); 


let characterAge = '';
(function () { 
    const address = getAddressPattern('characterAge', 'e8 ?? ?? ?? ?? 33 d2 ?? b8 00 01 00 00 ?? 8d');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        characterAge = processText(this.context.rdx, "NH", "characterAge");
    });
})(); 


(function () { 
    const address = getAddressPattern('characterDescription', 'e8 ?? ?? ?? ?? ?? 8b 07 ?? 8b 48 18');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "characterDescription");
    });
})(); 


(function () { 
    const address = getAddressPattern('handbookNoteName', 'e8 ?? ?? ?? ?? ?? 8b 06 ?? 8b 46 08 ?? 8d 0c c0');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "handbookNoteName");
    });
})(); 


(function () { 
    const address = getAddressPattern('handbookNoteDescription', 'e8 ?? ?? ?? ?? ?? 8b 44 ?? ?? ?? 88 2c 03 8b 44 ?? ?? ?? 8b ?? ?? ?? 8b d0 ?? 03 d1 ?? b0 0a e8 ?? ?? ?? ?? ?? 8b f8 ?? 8b 4d 08 ?? 8b b1 c8 00 00 00 ?? 85 f6 74 ?? ?? 8b dd ?? 8b 76 08 ?? 85 f6 74');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "handbookNoteDescription");
    });
})(); 


(function () { 
    const address = getAddressPattern('chatName', 'e8 ?? ?? ?? ?? ?? 8b d6 ?? 8b 4f 68 e8 ?? ?? ?? ?? ?? 8b 07 ?? 8d ?? ?? a8 00 00 00', 0xc);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "chatName");
    });
})(); 


(function () { 
    const address = getAddressPattern('chatMessage', 'e8 ?? ?? ?? ?? ?? 8b d6 ?? 8b 4f 68 e8 ?? ?? ?? ?? ?? 8b 07 ?? 8d ?? ?? a8 00 00 00', 0x9a);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "chatMessage");
    });
})(); 


(function () {
    const address = getAddressPattern('soulAbilityCategory', 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? 8b 8f c0 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "soulAbilityCategory");
    });
})(); 


(function () {
    const address = getAddressPattern('soulAbilityDescription1', 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? 8b 8f c8 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "soulAbilityDescription1");
    });
})(); 


(function () {
    const address = getAddressPattern('soulAbilityDescription2', 'e8 ?? ?? ?? ?? ?? 8b 97 b0 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "soulAbilityDescription2");
    });
})(); 


(function () {
    const address = getAddressPattern('actionCardName', 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 8b 48 08 ?? 8b 59 08 ba 9f 85 fb 41 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? 8b d0 ?? 8b cb e8 ?? ?? ?? ?? ?? 8b d0 0f 57 c0 33 c0 0f 11 44 ?? ?? ?? 89 44 ?? ?? ?? 8b');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "actionCardName");
    });
})(); 


(function () {
    const address = getAddressPattern('actionCardDescription1', 'e8 ?? ?? ?? ?? ?? 38 7d 19 74 ?? ?? 8b 56 18 eb');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "actionCardDescription1");
    });
})(); 


(function () {
    const address = getAddressPattern('actionCardDescription2', 'e8 ?? ?? ?? ?? 83 7f 30 00 74');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "actionCardDescription2");
    });
})(); 


let lectureSubject = '';
(function () {
    const address = getAddressPattern('lectureSubject', 'e8 ?? ?? ?? ?? ?? 8b 55 18 ?? 8b 8e b0 00 00 00 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        lectureSubject = processText(this.context.rdx, "NH", "lectureSubject");
    });
})(); 


(function () {
    const address = getAddressPattern('lectureName', 'e8 ?? ?? ?? ?? ?? 8b 55 20 ?? 8b 8e b8 00 00 00 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "lectureName");
    });
})(); 


(function () {
    const address = getAddressPattern('lectureDescription1', 'e8 ?? ?? ?? ?? ?? 8b 86 c0 00 00 00 b9 fe');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "lectureDescription1");
    });
})(); 


(function () {
    const address = getAddressPattern('lectureDescription2', 'e8 ?? ?? ?? ?? ?? 8b 86 c8 00 00 00 ?? 21');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "lectureDescription2");
    });
})(); 


(function () {
    const address = getAddressPattern('lectureDescription3', 'e8 ?? ?? ?? ?? ?? 33 f6 ?? 89 75 87 ?? 0f');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "lectureDescription3");
    });
})(); 


(function () {
    const address = getAddressPattern('bestiaryName', 'e8 ?? ?? ?? ?? 0f b6 86 0a 01 00 00 ?? 33 ff ?? 89');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "bestiaryName");
    });
})(); 


(function () {
    const address = getAddressPattern('bestiaryDescription', 'e8 ?? ?? ?? ?? ?? ff c7 ?? 8d ?? c0 e8');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "bestiaryDescription");
    });
})(); 


(function () {
    const address = getAddressPattern('recipeName', 'e8 ?? ?? ?? ?? 8b 03 8d 88');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "recipeName");
    });
})(); 


(function () {
    const address = getAddressPattern('recipeDescription', 'e8 ?? ?? ?? ?? ?? 8b 44 ?? ?? ?? 88 2c 03 8b 44');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "recipeDescription");
    });
})(); 


(function () {
    const address = getAddressPattern('recipeShop', 'e8 ?? ?? ?? ?? ?? 8b 4c ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 83 c4 50 ?? 5f ?? 5e ?? 5d ?? 5c 5f 5e 5d c3 cc cc cc cc cc cc cc cc cc cc cc cc ?? 89');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "recipeShop");
    });
})(); 


(function () {
    const address = getAddressPattern('rewardDescription', 'e8 ?? ?? ?? ?? ?? 8b 83 90 01 00 00 80');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "rewardDescription");
    });
})();


(function () {
    const address = getAddressPattern('sacredTreeDescription', 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 83 c4 20 5f c3 ?? 53 ?? 83 ec 40');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "sacredTreeDescription");
    });
})();


(function () {
    const address = getAddressPattern('freeTimeDescription', 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 6c ?? ?? ?? 8b 74 ?? ?? ?? 83 c4 30 5f c3 cc cc cc cc cc cc cc cc cc c6');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "third", "freeTimeDescription");
    });
})();


(function () { // Choices and description
    const address = getAddressPattern('selfStudy', 'e8 ?? ?? ?? ?? ?? 8b c3 ?? 83 c4 30 5b c3 cc cc ?? 8d 05 ?? ?? ?? ?? ?? 89');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "selfStudy");
    });
})();


(function () {
    const address = getAddressPattern('getActionCardName', 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 8b 48 08 ?? 8b 59 08 ba 9f 85 fb 41 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? 8b d0 ?? 8b cb e8 ?? ?? ?? ?? ?? 8b d0 0f 57 c0 33 c0');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "getActionCardName");
    });
})(); 


(function () {
    const address = getAddressPattern('getActionCardDescription1', 'e8 ?? ?? ?? ?? ?? 8b 7f 18 ?? 85 ff 74');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "getActionCardDescription1");
    });
})(); 


(function () {
    const address = getAddressPattern('getActionCardDescription2', 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 20 e8 ?? ?? ?? ?? eb');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "getActionCardDescription2");
    });
})(); 


(function () {
    const address = getAddressPattern('getActionCardDescription3', 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 38 e8 ?? ?? ?? ?? ?? 8b 4c ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 83 c4 60 5f 5e 5d c3 cc cc cc cc');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "getActionCardDescription3");
    });
})(); 


(function () { // And in the research building
    const address = getAddressPattern('xanaduChallengeName', 'e8 ?? ?? ?? ?? ?? 8b 57 48 ?? 8b 8f 60 01');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "xanaduChallengeName");
    });
})(); 


(function () { // And in the research building, and the chapel
    const address = getAddressPattern('xanaduChallengeDescription1', 'e8 ?? ?? ?? ?? ?? 8b 57 48 ?? 8b 8f 60 01', 0x10);
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "xanaduChallengeDescription1");
    });
})(); 


(function () { // And in the research building, and the chapel
    const address = getAddressPattern('xanaduChallengeDescription2', 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 8d 15');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "second", "xanaduChallengeDescription2");
    });
})(); 


(function () { 
    const address = getAddressPattern('newSpotDescription1', 'e8 ?? ?? ?? ?? ?? 8b 97 58 02 00 00 ?? 8b 87 60 02 00 00 ?? 8d 1c c2 ?? 3b d3 74 ?? 0f 1f 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "newSpotDescription1");
    });
})(); 


(function () {
    const address = getAddressPattern('newSpotDescription2', 'e8 ?? ?? ?? ?? ?? 8b 97 58 02 00 00 ?? 8b 87 60 02 00 00 ?? 8d 1c c2 ?? 3b d3 74 ?? 66 0f 1f 44 00 00');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "newSpotDescription2");
    });
})(); 


(function () {
    const address = getAddressPattern('newSpotDescription3', 'e8 ?? ?? ?? ?? ?? 8b 8b 38 01 00 00 ?? 85 c9 0f 84');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "newSpotDescription3");
    });
})(); 


(function () {
    const address = getAddressPattern('newSpotDescription4', 'e8 ?? ?? ?? ?? ?? 0f b6 ?? ?? ?? 8b d6');
    if(!address)
        return;
    Interceptor.attach(address, function (args) {
        processText(this.context.rdx, "main", "newSpotDescription4");
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


let previousInventoryName = '';
let shouldSkip = false;
let resetTimer = null;
// The three hooks related to the inventory would sometimes get called more than once, so we skip subsequent calls and reset the variables after 10ms
function resetStateLater() { 
    if (resetTimer !== null)
        clearTimeout(resetTimer);

    resetTimer = setTimeout(() => {
        previousInventoryName = '';
        shouldSkip = false;
        resetTimer = null;
    }, 20);
}


let currentDialogue = '';
function processText(context, handler, name) {
    if(isDebugging)
        console.warn(`Processing ${name}'s text`);

    const address = context;
    let text = '';

    if (name === "name") {
        // To extract the caracter's name after dialogue text if someone says something alongside choices
        text = address.readUtf8String();
        setTimeout(() => {
            text = cleanText(text);
            mainHandler(text);
        }, 10);
        return;
    }

    else if (name === "dialogue" || name === "activeVoiceDialogue") { 
        // Dialogue gets called before name. 
        text = address.readUtf8String();
        currentDialogue = text;
        setTimeout(() => {
            text = cleanText(text);
            mainHandler(text);
        }, 30);
        return;
    }

    else if (name === "characterDescription") {
        text = address.readUtf8String();
        setTimeout(() => {
            text = cleanText(text);
            mainHandler(characterAge + '\t' + text);
        }, 20);
        return;
    }

    else if (name === "lectureDescription3") {
        text = address.readUtf8String();
        setTimeout(() => {
            text = cleanText(text);
            secondHandler(text);
        }, 20);
        return;
    }

    else if (name === "inventoryName") {
        text = address.readUtf8String();
        text = cleanText(text);

        if (text === previousInventoryName && text !== '') { 
            shouldSkip = true;
            return;
        }
        
        secondHandler(text);
        
        previousInventoryName = text;
        resetStateLater();
        return;
    }

    else if (name === "selfStudy") {
        text = address.readUtf8String();
        setTimeout(() => {
            text = cleanText(text);
            text = cleanText(text);
            
            if (text === currentDialogue)
                return;

            mainHandler(text);
        }, 40);
        return;
    }


    else if (name === "inventoryDescription" || name === "inventoryEffect1" || name === "inventoryEffect2") {
        if (shouldSkip)
            return;
        
        text = address.readUtf8String();
        text = cleanText(text);
        secondHandler(text);
        return;
    }

    else 
        text = address.readUtf8String();
    
    text = cleanText(text);

    switch(name) {
        case "helpName":
        case "chatMessage":
        case "soulAbilityCategory":
        case "soulAbilityDescription1":
        case "actionCardName":
        case "bestiaryName":
        case "recipeName":
        case "recipeDescription":
        case "getActionCardName":
        case "xanaduChallengeName":
            text = text + '\n';
            break;

        case "lectureName":
            text = lectureSubject + '\t' + text + '\n';
            break;

        default:
            break;
    }

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


function cleanText(text) {
    return text
        .replace(/<[^<>]*>/g, '')
        .replace(/%[a-zA-Z0-9]+/g, ' ')
        .replace(/^\s*$/gm, '')
        .trim();
}