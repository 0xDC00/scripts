// ==UserScript==
// @name         Neptunia: Sisters VS Sisters
// @version      
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Idea Factory, Compile Heart
// * publisher   Idea Factory, Compile Heart
//
// https://store.steampowered.com/app/1932160/Neptunia_Sisters_VS_Sisters/
// ==/UserScript==


const Mono = require('./libMono.js');
const mainHandler = trans.send(s => s, '200+');
const secondHandler = trans.send(s => s, 200);


let name = '';
Mono.setHook('', 'InHouseLibrary.ADV.Local.Talk.AdvTalkController', 'SetName', 1, {
    onEnter(args) {
        // console.warn("In: AdvTalkController SetName");
        if (!args[1].isNull())
            name = args[1].readMonoString();
    }
});


let text = [];
Mono.setHook('', 'InHouseLibrary.ADV.Local.Talk.AdvTalkBodyText', 'SetMain', 1, {
    onEnter(args) {
        // console.warn("In: AdvTalkBodyText SetMain");
        text.push(args[1].readMonoString());

        setTimeout(processText, 50);  // Slight delay because the name function sometimes gets called slightly after the main text.
    }
});

function processText() {
    let fullText = text.join("\n");

    if (name && text)
        mainHandler(name + "\n" + fullText);

    else
        mainHandler(fullText);

    name = '';
    text = [];
}


let nameMovie = '';
Mono.setHook('', 'InHouseLibrary.ADV.Local.AdvTalk', 'SetName', 1, {
    onEnter(args) {
        let text = args[1].readMonoString();
    }
});


let textMovie = [];
Mono.setHook('', 'InHouseLibrary.ADV.Local.AdvTalk', 'SetBody', 1, {
    onEnter(args) {
        let text = args[1].readMonoString();

        setTimeout(processTextMovie, 50);
    }
});

function processTextMovie() {
    let fullText = textMovie.join("\n");

    if (nameMovie && textMovie)
        mainHandler(nameMovie + "\n" + fullText);

    else
        mainHandler(fullText);

    nameMovie = '';
    textMovie = [];
}


Mono.setHook('', 'Game.UI.MainMenu.ComboMake.SkillExplain.GameUiMainMenuComboMakeSkillExplain', 'CreateLetter', 1, {
    onEnter(args) {
        // console.warn("In: GameUiMainMenuComboMakeSkillExplain CreateLetter");
        let text = args[1].readMonoString();
        text = cleanText(text);
        secondHandler(text);
    }
});


Mono.setHook('', 'Game.UI.WipeTalk.GameUiWipeTalk', 'Play', 8, {
    onEnter(args) {
        // console.warn("In: GameUiWipeTalk Play");
        let name = args[7].readMonoString();
        let text = args[8].readMonoString();
        mainHandler(name + "\n" + text);
    }
});


Mono.setHook('', 'Game.UI.Confirm.Local.GameUiConfirmAccess', 'SetQuestion', 1, {
    onEnter(args) {
        // console.warn("In: GameUiConfirmAccess SetQuestion");
        if (!args[1].isNull()) {
            let text = args[1].readMonoString();
            text = cleanText(text);
            mainHandler(text);
        }
    }
});


Mono.setHook('', 'Game.UI.Help.Parts.Basic$Message', 'CreateText', 1, {
    onEnter(args) {
        // console.warn("In: Basic CreateText");
        if (!args[1].isNull()) {
            let text = args[1].readMonoString();
            text = cleanText(text);
            mainHandler(text);
        }
    }
});


Mono.setHook('', 'Game.ADV.Local.AdvFuncMessageCustom', 'Create', 1, {
    onEnter(args) {
        // console.warn("In: AdvFuncMessageCustom Create");
        let text = args[1].readMonoString();
        mainHandler(text);

    }
});


function cleanText(text) {
    return text
        .replace(/<[^>]*>/g, ' ')
        .trim();
}


console.warn("Known issue: \n- If you skip some text or events some of the skipped messages will be extracted.");