// ==UserScript==
// @name         DORAEMON STORY OF SEASONS
// @version      
// @author       Darkmans11
// @description  Steam
// * Marvelous Inc., Brownies Inc.
// * Unity (JIT)
// Dialog/Shop description
// https://store.steampowered.com/app/965230/DORAEMON__STORY_OF_SEASONS/
// ==/UserScript==

const {
    setHook
} = require('./libMono.js');

const handlerChar = trans.send((s) => s, '200++');

//public void SetExplain(string description, int inventory_count, int chest_count)
setHook('', 'ShopListItemExplainController', 'SetExplain', -1, {
    onEnter: (args) => {
        console.log('onEnter: ShopListItemExplainController.SetExplain');
        readString(args[1]);
    }
});

//public void SetInfoText(string info)
setHook('', 'MiniGameTutorialPanelUIPartController', 'SetInfoText', -1, {
    onEnter: (args) => {
        console.log('onEnter: MiniGameTutorialPanelUIPartController.SetInfoText');
        readString(args[1]);
    }
});

//public void Initialize(string talker_name, string talk_text, int talker_likability_degree_rate, UI.Talk.WindowTypeEnum window_type,
setHook('', 'TalkWindowUIPartController', 'Initialize', -1, {
    onEnter: (args) => {
        console.log('onEnter: TalkWindowUIPartController.Initialize.talker_name');
        readString(args[1]);
    }
});

//private string[] ConvertTexts(string[] texts, int max_characters_in_line, int max_lines)
setHook('', 'Typewriter', 'ConvertText', -1, {
    onEnter: (args) => {
        console.log('onEnter: Typewriter.ConvertText');
        readString(args[1]);
    }
});

function readString(address) {
    const s = address.readMonoString()

    if (s !== '') handlerChar(s + '\r\n');
}

// Replacer
trans.replace((s) => {
    return s
        .replace(/<.+?>|^\s+|\r?\n+$|@n|%co1|%coe|%hoe|%rbs|%rbe|%dot/g, '') // htmlTag | trimBeginSpace | trimEndNewLine
        ;
});