// ==UserScript==
// @name         KYOTO XANADU -the Blooming Phantom- / 亰都ザナドゥ -桜花幻舞-
// @version      1.03.2
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


let name = '';
(function () {
    const address = getAddressPattern('name', 'e8 ?? ?? ?? ?? ?? 8b 9e 80 01 00 00');
    Interceptor.attach(address, function (args) {
        // console.warn("in: name");

        const nameAddress = this.context.rdx;
        name = nameAddress.readUtf8String();
    });
})();


(function () { 
    const address = getAddressPattern('dialogue', 'e8 ?? ?? ?? ?? 89 9f 48 03');
    Interceptor.attach(address, function (args) {
        // console.warn("in: dialogue");

        const dialogueAddress = this.context.rdx;
        let dialogue = dialogueAddress.readUtf8String();
        dialogue = cleanText(dialogue);

        setTimeout(() => { // name hook called after dialogue
            mainHandler(name + '\n' + dialogue);
            name = '';
        }, 50);
    });
})();


(function () { 
    const address = getAddressPattern('cutsceneSubtitle', 'e8 ?? ?? ?? ?? 90 ?? 8b ?? ?? ?? ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8d ?? ?? d0 08 00 00');
    Interceptor.attach(address, function (args) {
        // console.warn("in: cutsceneSubtitle");

        const cutsceneSubtitleAddress = this.context.rdx;
        let cutsceneSubtitle = cutsceneSubtitleAddress.readUtf8String();
        cutsceneSubtitle = cleanText(cutsceneSubtitle);
        mainHandler(cutsceneSubtitle);
    });
})();


(function () { 
    const address = getAddressPattern('activeVoiceName', 'e8 ?? ?? ?? ?? ?? 8b 8b c0 01 00 00 8b 81 30 02');
    Interceptor.attach(address, function (args) {
        // console.warn("in: activeVoiceName");

        const activeVoiceNameAddress = this.context.rdx;
        let activeVoiceName = activeVoiceNameAddress.readUtf8String();
        mainHandler(activeVoiceName);
    });
})();


(function () { 
    const address = getAddressPattern('activeVoiceDialogue', 'e8 ?? ?? ?? ?? ?? 8b 93 b8 01 00 00 ?? 8d');
    Interceptor.attach(address, function (args) {
        // console.warn("in: activeVoiceDialogue");

        const activeVoiceDialogueAddress = this.context.rdx;
        let activeVoiceDialogue = activeVoiceDialogueAddress.readUtf8String();
        activeVoiceDialogue = cleanText(activeVoiceDialogue);

        setTimeout(() => {
            mainHandler(activeVoiceDialogue);
        }, 50);
    });
})();


(function () { // At the start of the game when asked a few questions in a row
    const address = getAddressPattern('choices1', 'e8 ?? ?? ?? ?? ?? 8b 57 30 8b 8a c8 03');
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices1");

        const choices1Address = this.context.rdx;
        let choices1 = choices1Address.readUtf8String();
        choices1 = cleanText(choices1);
        mainHandler(choices1);
    });
})();


(function () { 
    const address = getAddressPattern('choices2', 'e8 ?? ?? ?? ?? ?? 8b 47 18 ?? 8b 58 28 ?? 85');
    Interceptor.attach(address, function (args) {
        // console.warn("in: choices2");

        const choices2Address = this.context.rdx;
        let choices2 = choices2Address.readUtf8String();
        choices2 = cleanText(choices2);
        mainHandler(choices2);
    });
})();


(function () { 
    const address = getAddressPattern('backgroundNPCDialogue', 'e8 ?? ?? ?? ?? ?? 8b 8f 48 01 00 00 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: backgroundNPCDialogue");

        const backgroundNPCDialogueAddress = this.context.rdx;
        let backgroundNPCDialogue = backgroundNPCDialogueAddress.readUtf8String();
        backgroundNPCDialogue = cleanText(backgroundNPCDialogue);
        mainHandler(backgroundNPCDialogue);
    });
})(); 


(function () { 
    const address = getAddressPattern('backgroundNPCName', 'e8 ?? ?? ?? ?? 8b 8f 28 01 00 00 85 c9 74');
    Interceptor.attach(address, function (args) {
        // console.warn("in: backgroundNPCName");

        const backgroundNPCNameAddress = this.context.rdx;
        let backgroundNPCName = backgroundNPCNameAddress.readUtf8String();
        backgroundNPCName = cleanText(backgroundNPCName);
        mainHandler(backgroundNPCName);
    });
})(); 


(function () { // On solid blue background
    const address = getAddressPattern('systemMessage1', 'e8 ?? ?? ?? ?? ?? 85 c0 ?? 8b f8 74');
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage1");

        const systemMessage1Address = this.context.rdx;
        let systemMessage1 = systemMessage1Address.readUtf8String();
        systemMessage1 = cleanText(systemMessage1);
        mainHandler(systemMessage1);
    });
})();


(function () { // When asked to do something during a tutorial
    const address = getAddressPattern('systemMessage2', 'ff 50 60 ?? 8b 8f a8 00 00 00 ?? 8b', 0x3f);
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage2");

        const systemMessage2Address = this.context.rdx;
        let systemMessage2 = systemMessage2Address.readUtf8String();
        systemMessage2 = cleanText(systemMessage2);
        mainHandler(systemMessage2);
    });
})();


(function () { // Confirmation prompt when leaving a Xanadu labyrinth
    const address = getAddressPattern('systemMessage3', 'e8 ?? ?? ?? ?? 89 84 ?? ?? ?? ?? ?? 85 c0 74 ?? ?? 8d ?? ?? 30 ?? 3b cb 74');
    Interceptor.attach(address, function (args) {
        // console.warn("in: systemMessage3");

        const systemMessage3Address = this.context.rcx;
        let systemMessage3 = systemMessage3Address.readUtf8String();
        systemMessage3 = cleanText(systemMessage3);
        mainHandler(systemMessage3);
    });
})();


(function () { 
    const address = getAddressPattern('location1', '75 ?? ?? 83 f8 01 0f 86');
    Interceptor.attach(address, function (args) {
        // console.warn("in: location1");

        const location1Address = this.context.rdx;
        let location1 = location1Address.readUtf8String();
        location1 = cleanText(location1);
        mainHandler(location1);
    });
})(); 


(function () { 
    const address = getAddressPattern('location2', '74 ?? ?? 8b 8f 18 02 00 00 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: location2");

        const location2Address = this.context.rdx;
        let location2 = location2Address.readUtf8String();
        mainHandler(location2);
    });
})(); 


(function () { 
    const address = getAddressPattern('nextLocation', 'e8 ?? ?? ?? ?? ?? 8b 83 a8 01 00 00 8b 88 c8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: nextLocation");

        const nextLocationAddress = this.context.rdx;
        let nextLocation = nextLocationAddress.readUtf8String();
        mainHandler(nextLocation);
    });
})(); 


(function () { 
    const address = getAddressPattern('newObjective', 'e8 ?? ?? ?? ?? ?? 8b cd e8 ?? ?? ?? ?? 0f');
    Interceptor.attach(address, function (args) {
        // console.warn("in: newObjective");

        const newObjectiveAddress = this.context.rdx;
        let newObjective = newObjectiveAddress.readUtf8String();
        mainHandler(newObjective);
    });
})();


(function () { // On a solid blue background
    const address = getAddressPattern('tutorial1', 'e8 ?? ?? ?? ?? ?? 8b 87 58 01 00 00 0f bf 50 1c');
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial1");

        const tutorial1Address = this.context.rdx;
        let tutorial1 = tutorial1Address.readUtf8String();
        tutorial1 = cleanText(tutorial1);
        thirdHandler(tutorial1);
    });
})();


(function () { // On a transparent black background
    const address = getAddressPattern('tutorial2Name', 'e8 ?? ?? ?? ?? ?? 8b 4f 28 ?? 8b 47 38 f3 0f');
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial2Name");

        const tutorial2NameAddress = this.context.rdx;
        let tutorial2Name = tutorial2NameAddress.readUtf8String();
        tutorial2Name = cleanText(tutorial2Name);
        mainHandler(tutorial2Name);
    });
})();


(function () { // On a transparent black background
    const address = getAddressPattern('tutorial2Description', 'e8 ?? ?? ?? ?? ?? 8b 4f 30 ?? 8b 47 38 f3 0f 10 48 4c');
    Interceptor.attach(address, function (args) {
        // console.warn("in: tutorial2Description");

        const tutorial2DescriptionAddress = this.context.rdx;
        let tutorial2Description = tutorial2DescriptionAddress.readUtf8String();
        tutorial2Description = cleanText(tutorial2Description);
        mainHandler(tutorial2Description);
    });
})();


(function () { // Selecting the Help tab from the pause menu
    const address = getAddressPattern('helpCategory', 'e8 ?? ?? ?? ?? ?? 8b 57 10 ?? 8b 4e 20 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: helpCategory");

        const helpCategoryAddress = this.context.rdx;
        let helpCategory = helpCategoryAddress.readUtf8String();
        helpCategory = cleanText(helpCategory);
        secondHandler(helpCategory);
    });
})();


(function () { // Selecting the Help tab from the pause menu
    const address = getAddressPattern('helpName', 'e8 ?? ?? ?? ?? ?? 8b 4e 30 0f b6');
    Interceptor.attach(address, function (args) {
        // console.warn("in: helpName");

        const helpNameAddress = this.context.rdx;
        let helpName = helpNameAddress.readUtf8String();
        helpName = cleanText(helpName);
        secondHandler(helpName + '\n');
    });
})();


(function () { // Selecting the Help tab from the pause menu
    const address = getAddressPattern('helpDescription', 'e8 ?? ?? ?? ?? ?? 8b 44 ?? ?? ?? 88 34 03 ?? 8d ?? ?? 38');
    Interceptor.attach(address, function (args) {
        // console.warn("in: helpDescription");

        const helpDescriptionAddress = this.context.rdx;
        let helpDescription = helpDescriptionAddress.readUtf8String();
        helpDescription = cleanText(helpDescription);
        secondHandler(helpDescription);
    });
})();


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
    }, 10);
}


(function () {
    const address = getAddressPattern('inventoryName', 'e8 ?? ?? ?? ?? ?? 8b 77 20 ?? 85');
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryName");

        const inventoryNameAddress = this.context.rdx;
        let inventoryName = inventoryNameAddress.readUtf8String();

        if (inventoryName === previousInventoryName && inventoryName !== '') { 
            shouldSkip = true;
            return;
        }
        secondHandler(inventoryName);

        previousInventoryName = inventoryName;
        resetStateLater();
    });
})(); 


(function () {
    const address = getAddressPattern('inventoryDescription', 'e8 ?? ?? ?? ?? ?? 8b 47 60 ?? 85 c0 74 ?? 83');
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryDescription");

        const inventoryDescriptionAddress = this.context.rdx;
        let inventoryDescription = inventoryDescriptionAddress.readUtf8String();
        inventoryDescription = cleanText(inventoryDescription);

        if (!shouldSkip)
            secondHandler(inventoryDescription);
    });
})();


(function () {
    const address = getAddressPattern('inventoryEffect1', 'e8 ?? ?? ?? ?? ?? 8b 8c de f8 00 00 00');
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryEffect1");

        const inventoryEffect1Address = this.context.rdx;
        let inventoryEffect1 = inventoryEffect1Address.readUtf8String();
        inventoryEffect1 = cleanText(inventoryEffect1);

        if (!shouldSkip)
            secondHandler(inventoryEffect1);
    });
})(); 


(function () {
    const address = getAddressPattern('inventoryEffect2', 'e8 ?? ?? ?? ?? ?? 8b 46 60 83 a0 bc');
    Interceptor.attach(address, function (args) {
        // console.warn("in: inventoryEffect2");

        const inventoryEffect2Address = this.context.rdx;
        let inventoryEffect2 = inventoryEffect2Address.readUtf8String();
        inventoryEffect2 = cleanText(inventoryEffect2);

        if (!shouldSkip)
            secondHandler(inventoryEffect2);
    });
})(); 


(function () {
    const address = getAddressPattern('DLCinventoryName', 'e8 ?? ?? ?? ?? ?? 8b 4e 28 ?? 85 c9 74 ?? ?? 8b 53 30 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: DLCinventoryName");

        const DLCinventoryNameAddress = this.context.rdx;
        let DLCinventoryName = DLCinventoryNameAddress.readUtf8String();
        secondHandler(DLCinventoryName);
    });
})(); 


(function () {
    const address = getAddressPattern('DLCinventoryDescription', 'e8 ?? ?? ?? ?? ?? 8b 46 50 ?? 85');
    Interceptor.attach(address, function (args) {
        // console.warn("in: DLCinventoryDescription");

        const DLCinventoryDescriptionAddress = this.context.rdx;
        let DLCinventoryDescription = DLCinventoryDescriptionAddress.readUtf8String();
        DLCinventoryDescription = cleanText(DLCinventoryDescription);
        secondHandler(DLCinventoryDescription);
    });
})(); 


(function () { 
    const address = getAddressPattern('difficulty', 'e8 ?? ?? ?? ?? ?? 8b 4c ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 74 ?? ?? ?? 83 c4 40 5f c3 cc cc cc cc cc cc ?? 89 5c');
    Interceptor.attach(address, function (args) {
        // console.warn("in: difficulty");

        const difficultyAddress = this.context.rdx;
        let difficulty = difficultyAddress.readUtf8String();
        difficulty = cleanText(difficulty);
        thirdHandler(difficulty);
    });
})();


(function () { 
    const address = getAddressPattern('optionDescription', 'e8 ?? ?? ?? ?? ?? 21 a6 bc');
    Interceptor.attach(address, function (args) {
        // console.warn("in: optionDescription");

        const optionDescriptionAddress = this.context.rdx;
        let optionDescription = optionDescriptionAddress.readUtf8String();
        optionDescription = cleanText(optionDescription);
        thirdHandler(optionDescription);
    });
})();


(function () { 
    const address = getAddressPattern('characterName', 'e8 ?? ?? ?? ?? ?? 8b 17 ?? 8b 52 28 ?? 8b');
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterName");

        const characterNameAddress = this.context.rdx;
        let characterName = characterNameAddress.readUtf8String();
        characterName = cleanText(characterName);
        mainHandler(characterName);
    });
})(); 


let characterAge = '';
(function () { 
    const address = getAddressPattern('characterAge', 'e8 ?? ?? ?? ?? 33 d2 ?? b8 00 01 00 00 ?? 8d');
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterAge");

        const characterAgeAddress = this.context.rdx;
        characterAge = characterAgeAddress.readUtf8String();
    });
})(); 


(function () { 
    const address = getAddressPattern('characterDescription', 'e8 ?? ?? ?? ?? ?? 8b 07 ?? 8b 48 18');
    Interceptor.attach(address, function (args) {
        // console.warn("in: characterDescription");

        const characterDescriptionAddress = this.context.rdx;
        let characterDescription = characterDescriptionAddress.readUtf8String();
        characterDescription = cleanText(characterDescription);

        setTimeout(() => {
            mainHandler(characterAge + '\t' + characterDescription);
        }, 50);
    });
})(); 


(function () { 
    const address = getAddressPattern('handbookNoteName', 'e8 ?? ?? ?? ?? ?? 8b 06 ?? 8b 46 08 ?? 8d 0c c0');
    Interceptor.attach(address, function (args) {
        // console.warn("in: handbookNoteName");

        const handbookNoteNameAddress = this.context.rdx;
        let handbookNoteName = handbookNoteNameAddress.readUtf8String();
        handbookNoteName = cleanText(handbookNoteName);
        secondHandler(handbookNoteName);
    });
})(); 


(function () { 
    const address = getAddressPattern('handbookNoteDescription', 'e8 ?? ?? ?? ?? ?? 8b 44 ?? ?? ?? 88 2c 03 8b 44 ?? ?? ?? 8b ?? ?? ?? 8b d0 ?? 03 d1 ?? b0 0a e8 ?? ?? ?? ?? ?? 8b f8 ?? 8b 4d 08 ?? 8b b1 c8 00 00 00 ?? 85 f6 74 ?? ?? 8b dd ?? 8b 76 08 ?? 85 f6 74');
    Interceptor.attach(address, function (args) {
        // console.warn("in: handbookNoteDescription");

        const handbookNoteDescriptionAddress = this.context.rdx;
        let handbookNoteDescription = handbookNoteDescriptionAddress.readUtf8String();
        handbookNoteDescription = cleanText(handbookNoteDescription);
        secondHandler(handbookNoteDescription);
    });
})(); 


(function () { 
    const address = getAddressPattern('chatName', 'e8 ?? ?? ?? ?? ?? 8b d6 ?? 8b 4f 68 e8 ?? ?? ?? ?? ?? 8b 07 ?? 8d ?? ?? a8 00 00 00', 0xc);
    Interceptor.attach(address, function (args) {
        // console.warn("in: chatName");

        const chatNameAddress = this.context.rdx;
        let chatName = chatNameAddress.readUtf8String();
        chatName = cleanText(chatName);
        secondHandler(chatName);
    });
})(); 


(function () { 
    const address = getAddressPattern('chatMessage', 'e8 ?? ?? ?? ?? ?? 8b d6 ?? 8b 4f 68 e8 ?? ?? ?? ?? ?? 8b 07 ?? 8d ?? ?? a8 00 00 00', 0x9a);
    Interceptor.attach(address, function (args) {
        // console.warn("in: chatMessage");

        const chatMessageAddress = this.context.rdx;
        let chatMessage = chatMessageAddress.readUtf8String();
        chatMessage = cleanText(chatMessage);
        secondHandler(chatMessage + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('soulAbilityCategory', 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? 8b 8f c0 01');
    Interceptor.attach(address, function (args) {
        // console.warn("in: soulAbilityCategory");

        const soulAbilityCategoryAddress = this.context.rdx;
        let soulAbilityCategory = soulAbilityCategoryAddress.readUtf8String();
        secondHandler(soulAbilityCategory + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('soulAbilityDescription1', 'e8 ?? ?? ?? ?? ?? 8b ?? ?? ?? 8b 8f c8 01');
    Interceptor.attach(address, function (args) {
        // console.warn("in: soulAbilityDescription1");

        const soulAbilityDescription1Address = this.context.rdx;
        let soulAbilityDescription1 = soulAbilityDescription1Address.readUtf8String();
        soulAbilityDescription1 = cleanText(soulAbilityDescription1);
        secondHandler(soulAbilityDescription1 + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('soulAbilityDescription2', 'e8 ?? ?? ?? ?? ?? 8b 97 b0 01');
    Interceptor.attach(address, function (args) {
        // console.warn("in: soulAbilityDescription2");

        const soulAbilityDescription2Address = this.context.rdx;
        let soulAbilityDescription2 = soulAbilityDescription2Address.readUtf8String();
        soulAbilityDescription2 = cleanText(soulAbilityDescription2);
        secondHandler(soulAbilityDescription2);
    });
})(); 


(function () {
    const address = getAddressPattern('actionCardName', 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 8b 48 08 ?? 8b 59 08 ba 9f 85 fb 41 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? 8b d0 ?? 8b cb e8 ?? ?? ?? ?? ?? 8b d0 0f 57 c0 33 c0 0f 11 44 ?? ?? ?? 89 44 ?? ?? ?? 8b');
    Interceptor.attach(address, function (args) {
        // console.warn("in: actionCardName");

        const actionCardNameAddress = this.context.rdx;
        let actionCardName = actionCardNameAddress.readUtf8String();
        secondHandler(actionCardName + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('actionCardDescription1', 'e8 ?? ?? ?? ?? ?? 38 7d 19 74 ?? ?? 8b 56 18 eb');
    Interceptor.attach(address, function (args) {
        // console.warn("in: actionCardDescription1");

        const actionCardDescription1Address = this.context.rdx;
        let actionCardDescription1 = actionCardDescription1Address.readUtf8String();
        actionCardDescription1 = cleanText(actionCardDescription1);
        secondHandler(actionCardDescription1);
    });
})(); 


(function () {
    const address = getAddressPattern('actionCardDescription2', 'e8 ?? ?? ?? ?? 83 7f 30 00 74');
    Interceptor.attach(address, function (args) {
        // console.warn("in: actionCardDescription2");

        const actionCardDescription2Address = this.context.rdx;
        let actionCardDescription2 = actionCardDescription2Address.readUtf8String();
        actionCardDescription2 = cleanText(actionCardDescription2);
        secondHandler(actionCardDescription2);
    });
})(); 


let lectureSubject = '';
(function () {
    const address = getAddressPattern('lectureSubject', 'e8 ?? ?? ?? ?? ?? 8b 55 18 ?? 8b 8e b0 00 00 00 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: lectureSubject");

        const lectureSubjectAddress = this.context.rdx;
        lectureSubject = lectureSubjectAddress.readUtf8String();
        lectureSubject = cleanText(lectureSubject);
    });
})(); 


(function () {
    const address = getAddressPattern('lectureName', 'e8 ?? ?? ?? ?? ?? 8b 55 20 ?? 8b 8e b8 00 00 00 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: lectureName");

        const lectureNameAddress = this.context.rdx;
        let lectureName = lectureNameAddress.readUtf8String();
        lectureName = cleanText(lectureName);
        secondHandler(lectureSubject + '\t' + lectureName + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('lectureDescription1', 'e8 ?? ?? ?? ?? ?? 8b 86 c0 00 00 00 b9 fe');
    Interceptor.attach(address, function (args) {
        // console.warn("in: lectureDescription1");

        const lectureDescription1Address = this.context.rdx;
        let lectureDescription1 = lectureDescription1Address.readUtf8String();
        lectureDescription1 = cleanText(lectureDescription1);
        secondHandler(lectureDescription1);
    });
})(); 


(function () {
    const address = getAddressPattern('lectureDescription2', 'e8 ?? ?? ?? ?? ?? 8b 86 c8 00 00 00 ?? 21');
    Interceptor.attach(address, function (args) {
        // console.warn("in: lectureDescription2");

        const lectureDescription2Address = this.context.rdx;
        let lectureDescription2 = lectureDescription2Address.readUtf8String();
        lectureDescription2 = cleanText(lectureDescription2);
        secondHandler(lectureDescription2);
    });
})(); 


(function () {
    const address = getAddressPattern('lectureDescription3', 'e8 ?? ?? ?? ?? ?? 33 f6 ?? 89 75 87 ?? 0f');
    Interceptor.attach(address, function (args) {
        // console.warn("in: lectureDescription3");

        const lectureDescription3Address = this.context.rdx;
        let lectureDescription3 = lectureDescription3Address.readUtf8String();
        lectureDescription3 = cleanText(lectureDescription3);

        setTimeout(() => {
            secondHandler(lectureDescription3);
        },25);
    });
})(); 


(function () {
    const address = getAddressPattern('bestiaryName', 'e8 ?? ?? ?? ?? 0f b6 86 0a 01 00 00 ?? 33 ff ?? 89');
    Interceptor.attach(address, function (args) {
        // console.warn("in: bestiaryName");

        const bestiaryNameAddress = this.context.rdx;
        let bestiaryName = bestiaryNameAddress.readUtf8String();
        bestiaryName = cleanText(bestiaryName);
        secondHandler(bestiaryName + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('bestiaryDescription', 'e8 ?? ?? ?? ?? ?? ff c7 ?? 8d ?? c0 e8');
    Interceptor.attach(address, function (args) {
        // console.warn("in: bestiaryDescription");

        const bestiaryDescriptionAddress = this.context.rdx;
        let bestiaryDescription = bestiaryDescriptionAddress.readUtf8String();
        bestiaryDescription = cleanText(bestiaryDescription);
        secondHandler(bestiaryDescription);
    });
})(); 


(function () {
    const address = getAddressPattern('recipeName', 'e8 ?? ?? ?? ?? 8b 03 8d 88');
    Interceptor.attach(address, function (args) {
        // console.warn("in: recipeName");

        const recipeNameAddress = this.context.rdx;
        let recipeName = recipeNameAddress.readUtf8String();
        recipeName = cleanText(recipeName);
        secondHandler(recipeName + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('recipeDescription', 'e8 ?? ?? ?? ?? ?? 8b 44 ?? ?? ?? 88 2c 03 8b 44');
    Interceptor.attach(address, function (args) {
        // console.warn("in: recipeDescription");

        const recipeDescriptionAddress = this.context.rdx;
        let recipeDescription = recipeDescriptionAddress.readUtf8String();
        recipeDescription = cleanText(recipeDescription);
        secondHandler(recipeDescription + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('recipeShop', 'e8 ?? ?? ?? ?? ?? 8b 4c ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 83 c4 50 ?? 5f ?? 5e ?? 5d ?? 5c 5f 5e 5d c3 cc cc cc cc cc cc cc cc cc cc cc cc ?? 89');
    Interceptor.attach(address, function (args) {
        // console.warn("in: recipeShop");

        const recipeShopAddress = this.context.rdx;
        let recipeShop = recipeShopAddress.readUtf8String();
        recipeShop = cleanText(recipeShop);
        secondHandler(recipeShop);
    });
})(); 


(function () {
    const address = getAddressPattern('rewardDescription', 'e8 ?? ?? ?? ?? ?? 8b 83 90 01 00 00 80');
    Interceptor.attach(address, function (args) {
        // console.warn("in: rewardDescription");

        const rewardDescriptionAddress = this.context.rdx;
        let rewardDescription = rewardDescriptionAddress.readUtf8String();
        rewardDescription = cleanText(rewardDescription);
        thirdHandler(rewardDescription);
    });
})();


(function () {
    const address = getAddressPattern('sacredTreeDescription', 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 83 c4 20 5f c3 ?? 53 ?? 83 ec 40');
    Interceptor.attach(address, function (args) {
        // console.warn("in: sacredTreeDescription");

        const sacredTreeDescriptionAddress = this.context.rdx;
        let sacredTreeDescription = sacredTreeDescriptionAddress.readUtf8String();
        sacredTreeDescription = cleanText(sacredTreeDescription);
        thirdHandler(sacredTreeDescription);
    });
})();


(function () {
    const address = getAddressPattern('freeTimeDescription', 'e8 ?? ?? ?? ?? ?? 8b 5c ?? ?? ?? 8b 6c ?? ?? ?? 8b 74 ?? ?? ?? 83 c4 30 5f c3 cc cc cc cc cc cc cc cc cc c6');
    Interceptor.attach(address, function (args) {
        // console.warn("in: freeTimeDescription");

        const freeTimeDescriptionAddress = this.context.rdx;
        let freeTimeDescription = freeTimeDescriptionAddress.readUtf8String();
        freeTimeDescription = cleanText(freeTimeDescription);
        thirdHandler(freeTimeDescription);
    });
})();


(function () { // Choices and description
    const address = getAddressPattern('selfStudy', 'e8 ?? ?? ?? ?? ?? 8b c3 ?? 83 c4 30 5b c3 cc cc ?? 8d 05 ?? ?? ?? ?? ?? 89');
    Interceptor.attach(address, function (args) {
        // console.warn("in: selfStudy");

        const selfStudyAddress = this.context.rdx;
        let selfStudy = selfStudyAddress.readUtf8String();
        selfStudy = cleanText(selfStudy);
        mainHandler(selfStudy);
    });
})();


(function () {
    const address = getAddressPattern('getActionCardName', 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 8b 48 08 ?? 8b 59 08 ba 9f 85 fb 41 ?? 8d 0d ?? ?? ?? ?? e8 ?? ?? ?? ?? 8b d0 ?? 8b cb e8 ?? ?? ?? ?? ?? 8b d0 0f 57 c0 33 c0');
    Interceptor.attach(address, function (args) {
        // console.warn("in: getActionCardName");

        const getActionCardNameAddress = this.context.rdx;
        let getActionCardName = getActionCardNameAddress.readUtf8String();
        secondHandler(getActionCardName + '\n');
    });
})(); 


(function () {
    const address = getAddressPattern('getActionCardDescription1', 'e8 ?? ?? ?? ?? ?? 8b 7f 18 ?? 85 ff 74');
    Interceptor.attach(address, function (args) {
        // console.warn("in: getActionCardDescription1");

        const getActionCardDescription1Address = this.context.rdx;
        let getActionCardDescription1 = getActionCardDescription1Address.readUtf8String();
        getActionCardDescription1 = cleanText(getActionCardDescription1);
        secondHandler(getActionCardDescription1);
    });
})(); 


(function () {
    const address = getAddressPattern('getActionCardDescription2', 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 20 e8 ?? ?? ?? ?? eb');
    Interceptor.attach(address, function (args) {
        // console.warn("in: getActionCardDescription2");

        const getActionCardDescription2Address = this.context.rdx;
        let getActionCardDescription2 = getActionCardDescription2Address.readUtf8String();
        getActionCardDescription2 = cleanText(getActionCardDescription2);
        secondHandler(getActionCardDescription2);
    });
})(); 


(function () {
    const address = getAddressPattern('getActionCardDescription3', 'e8 ?? ?? ?? ?? 90 ?? 8d ?? ?? 38 e8 ?? ?? ?? ?? ?? 8b 4c ?? ?? ?? 33 cc e8 ?? ?? ?? ?? ?? 8b 9c ?? ?? ?? ?? ?? ?? 83 c4 60 5f 5e 5d c3 cc cc cc cc');
    Interceptor.attach(address, function (args) {
        // console.warn("in: getActionCardDescription3");

        const getActionCardDescription3Address = this.context.rdx;
        let getActionCardDescription3 = getActionCardDescription3Address.readUtf8String();
        getActionCardDescription3 = cleanText(getActionCardDescription3);
        secondHandler(getActionCardDescription3);
    });
})(); 


(function () { // And in the research building
    const address = getAddressPattern('xanaduChallengeName', 'e8 ?? ?? ?? ?? ?? 8b 57 48 ?? 8b 8f 60 01');
    Interceptor.attach(address, function (args) {
        // console.warn("in: xanaduChallengeName");

        const xanaduChallengeNameAddress = this.context.rdx;
        let xanaduChallengeName = xanaduChallengeNameAddress.readUtf8String();
        secondHandler(xanaduChallengeName + '\n');
    });
})(); 


(function () { // And in the research building, and the chapel
    const address = getAddressPattern('xanaduChallengeDescription1', 'e8 ?? ?? ?? ?? ?? 8b 57 48 ?? 8b 8f 60 01', 0x10);
    Interceptor.attach(address, function (args) {
        // console.warn("in: xanaduChallengeDescription1");

        const xanaduChallengeDescription1Address = this.context.rdx;
        let xanaduChallengeDescription1 = xanaduChallengeDescription1Address.readUtf8String();
        xanaduChallengeDescription1 = cleanText(xanaduChallengeDescription1);
        secondHandler(xanaduChallengeDescription1);
    });
})(); 


(function () { // And in the research building, and the chapel
    const address = getAddressPattern('xanaduChallengeDescription2', 'e8 ?? ?? ?? ?? ?? 8b 05 ?? ?? ?? ?? ?? 8d 15');
    Interceptor.attach(address, function (args) {
        // console.warn("in: xanaduChallengeDescription2");

        const xanaduChallengeDescription2Address = this.context.rdx;
        let xanaduChallengeDescription2 = xanaduChallengeDescription2Address.readUtf8String();
        xanaduChallengeDescription2 = cleanText(xanaduChallengeDescription2);
        secondHandler(xanaduChallengeDescription2);
    });
})(); 


(function () { 
    const address = getAddressPattern('newSpotDescription1', 'e8 ?? ?? ?? ?? ?? 8b 97 58 02 00 00 ?? 8b 87 60 02 00 00 ?? 8d 1c c2 ?? 3b d3 74 ?? 0f 1f 00');
    Interceptor.attach(address, function (args) {
        // console.warn("in: newSpotDescription1");

        const newSpotDescription1Address = this.context.rdx;
        let newSpotDescription1 = newSpotDescription1Address.readUtf8String();
        newSpotDescription1 = cleanText(newSpotDescription1);
        mainHandler(newSpotDescription1);
    });
})(); 


(function () {
    const address = getAddressPattern('newSpotDescription2', 'e8 ?? ?? ?? ?? ?? 8b 97 58 02 00 00 ?? 8b 87 60 02 00 00 ?? 8d 1c c2 ?? 3b d3 74 ?? 66 0f 1f 44 00 00');
    Interceptor.attach(address, function (args) {
        // console.warn("in: newSpotDescription2");

        const newSpotDescription2Address = this.context.rdx;
        let newSpotDescription2 = newSpotDescription2Address.readUtf8String();
        newSpotDescription2 = cleanText(newSpotDescription2);
        mainHandler(newSpotDescription2);
    });
})(); 


(function () {
    const address = getAddressPattern('newSpotDescription3', 'e8 ?? ?? ?? ?? ?? 8b 8b 38 01 00 00 ?? 85 c9 0f 84');
    Interceptor.attach(address, function (args) {
        // console.warn("in: newSpotDescription3");

        const newSpotDescription3Address = this.context.rdx;
        let newSpotDescription3 = newSpotDescription3Address.readUtf8String();
        newSpotDescription3 = cleanText(newSpotDescription3);
        mainHandler(newSpotDescription3);
    });
})(); 


(function () {
    const address = getAddressPattern('newSpotDescription4', 'e8 ?? ?? ?? ?? ?? 0f b6 ?? ?? ?? 8b d6');
    Interceptor.attach(address, function (args) {
        // console.warn("in: newSpotDescription4");

        const newSpotDescription4Address = this.context.rdx;
        let newSpotDescription4 = newSpotDescription4Address.readUtf8String();
        newSpotDescription4 = cleanText(newSpotDescription4);
        mainHandler(newSpotDescription4);
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


function cleanText(text) {
    return text
        .replace(/<[^<>]*>/g, '')
        .replace(/%[a-zA-Z0-9]+/g, ' ');
}