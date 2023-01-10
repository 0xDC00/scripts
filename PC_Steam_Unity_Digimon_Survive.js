// ==UserScript==
// @name         Digimon Survive
// @version      
// @author       Koukdw
// @description  Steam
// * HYDE Inc, Bandai Namco Entertainment Inc.
// * Unity (JIT)
//
// https://store.steampowered.com/app/871980/Digimon_Survive/
//
// ==/UserScript==

const Mono = require('./libMono.js');
const {
    setHook,
    createFunction
} = Mono;

const handlerChar = trans.send((s) => s, '200++');

console.log(`
    WARNING: Digimon Survive on PC doesn't come with japanese
    To get japanese you need to install a mod

    Japanese text mod
    https://gamebanana.com/mods/394219

    Supported:
        - Speaker
        - Dialogue
        - Question & Answers
        - Help Menu
`);

//void AdvEngine.AdvText::SetText(string talkID, string speaker, string text, string voiceValue, int talkCharId, bool isSameSpeaker, bool isBacklog, int poseId, int skinId)
setHook('', 'AdvEngine.AdvText', 'SetText', -1, {
    onEnter: (args) => {
        console.log('onEnter: AdvEngine.AdvText::SetText');
        readString(args[2]);
        readString(args[3]);
    }
})

//static void AdvEngineMain::selectHeaderText(string textId, string text)
setHook('', 'AdvEngineMain', 'selectHeaderText', -1, {
    onEnter: (args) => {
        console.log('onEnter: AdvEngineMain::selectHeaderText');
        readString(args[1]);
    }
})

//void uiAdvSelect::AddSelect(string textId, string text, int position, int choiceType, int val1, int val2)
setHook('', 'uiAdvSelect', 'AddSelect', -1, {
    onEnter: (args) => {
        console.log('onEnter: uiAdvSelect::AddSelect');
        readString(args[2]);
    }
})

const DBHelpText_GetString = Mono.use('', 'Game.Databases.DBHelpText').GetString.implementation;
console.log('DBHelpText_GetString', DBHelpText_GetString);

//void MainMenuTutorialDetailView::SetData(DBHelpText dbHelpText, Sprite sprite, string detailKey, bool isAnim)
setHook('','MainMenuTutorialDetailView', 'SetData', -1,  {
    onEnter: function (args) {
        console.log('onEnter: MainMenuTutorialDetailView::SetData');

        let ptr = createLabelStringId(args[3]);
        let label = DBHelpText_GetString(args[1], ptr);
        let text = DBHelpText_GetString(args[1], args[3]);

        readString(label);
        readString(text);
    },
})

// Change HELP_DETAIL_* to HELP_NAME_*
function createLabelStringId(str_id_ptr){
    let str_id = str_id_ptr.readMonoString();

    //label doesn't have input specfic names
    str_id = str_id
                .replace("_kb", "")
                .replace("_kb_f", "")
                .replace("_sw", "")
                .replace("_p4", "")
                .replace("_xb", "")
                .replace("DETAIL", "NAME");

    const ptr = Memory.allocMonoString(str_id);
    return ptr;
}


function readString(address) {
    const s = address.readMonoString()

    if (s !== '') handlerChar(s + '\r\n');
}

// Unhandled emojis are hidden
// Feel free to add more emojis
// Unpack the common file with AssetStudio at /StandaloneWindows64/common
// search for "emoji" in the searchbar


trans.replace((s) => {
    return s
        .replace("<sprite index=8>",  "(Circle)")   // <= BEGIN PS4 EmojiStrMap
        .replace("<sprite index=9>",  "(Cross)")
        .replace("<sprite index=10>", "(Square)")
        .replace("<sprite index=11>", "(Triangle)")
        .replace("<sprite index=12>", "(L1)")
        .replace("<sprite index=13>", "(R1)")
        .replace("<sprite index=14>", "(L2)")
        .replace("<sprite index=15>", "(R2)")
        .replace("<sprite index=16>", "(JOY_L)")
        .replace("<sprite index=17>", "(JOY_R)")
        .replace("<sprite index=18>", "(DPAD_UP)")
        .replace("<sprite index=19>", "(DPAD_UPDOWN)")
        .replace("<sprite index=44>", "(DPAD_ALL)")
        .replace("<sprite index=91>", "(DPAD_RIGHT)")
        .replace("<sprite index=92>", "(DPAD_DOWN)")
        .replace("<sprite index=93>", "(DPAD_LEFT)")
        .replace("<sprite index=126>", "(JOY_L3)")
        .replace("<sprite index=127>", "(JOY_R3)")
        .replace("<sprite index=128>", "(Select)")  // <= END PS4 EmojiStrMap
        .replace("<sprite index=20>", "(A)")        // <= BEGIN Switch EmojiStrMap
        .replace("<sprite index=21>", "(B)")
        .replace("<sprite index=22>", "(Y)")
        .replace("<sprite index=23>", "(X)")
        .replace("<sprite index=24>", "(L)")
        .replace("<sprite index=25>", "(R)")
        .replace("<sprite index=26>", "(ZL)")
        .replace("<sprite index=27>", "(ZR)")
        .replace("<sprite index=28>", "(JOY_L)")
        .replace("<sprite index=29>", "(JOY_R)")
        .replace("<sprite index=30>", "(DPAD_UP)")
        .replace("<sprite index=31>", "(DPAD_UPDOWN)")
        .replace("<sprite index=45>", "(DPAD_ALL)")
        .replace("<sprite index=94>", "(DPAD_RIGHT)")
        .replace("<sprite index=95>", "(DPAD_DOWN)")
        .replace("<sprite index=96>", "(DPAD_LEFT)")
        .replace("<sprite index=129>", "(Select)")  // <= END Switch EmojiStrMap
        .replace("<sprite index=32>", "(B)")        // <= BEGIN Xbox EmojiStrMap
        .replace("<sprite index=33>", "(A)")
        .replace("<sprite index=34>", "(X)")
        .replace("<sprite index=35>", "(Y)")
        .replace("<sprite index=36>", "(LB)")
        .replace("<sprite index=37>", "(RB)")
        .replace("<sprite index=38>", "(LT)")
        .replace("<sprite index=39>", "(RT)")
        .replace("<sprite index=40>", "(JOY_LS)")
        .replace("<sprite index=41>", "(JOY_RS)")
        .replace("<sprite index=42>", "(DPAD_UP)")
        .replace("<sprite index=43>", "(DPAD_UPDOWN)")
        .replace("<sprite index=46>", "(DPAD_ALL)")
        .replace("<sprite index=97>", "(DPAD_RIGHT)")
        .replace("<sprite index=98>", "(DPAD_DOWN)")
        .replace("<sprite index=99>", "(DPAD_LEFT)")
        .replace("<sprite index=130>", "(Select)")  // <= END Xbox EmojiStrMap
        .replace("<sprite index=47>", "[Esc]")      // <= BEGIN Keyboard EmojiStrMap
        .replace("<sprite index=48>", "[0]")
        .replace("<sprite index=49>", "[1]")
        .replace("<sprite index=50>", "[2]")
        .replace("<sprite index=51>", "[3]")
        .replace("<sprite index=52>", "[4]")
        .replace("<sprite index=53>", "[5]")
        .replace("<sprite index=54>", "[6]")
        .replace("<sprite index=55>", "[7]")
        .replace("<sprite index=56>", "[8]")
        .replace("<sprite index=57>", "[9]")
        .replace("<sprite index=58>", "[Space]")
        .replace("<sprite index=59>", "[Enter]")
        .replace("<sprite index=60>", "[Backspace]")
        .replace("<sprite index=61>", "[UpArrow]")
        .replace("<sprite index=62>", "[DownArrow]")
        .replace("<sprite index=63>", "[LeftArrow]")
        .replace("<sprite index=64>", "[RightArrow]")
        .replace("<sprite index=65>", "[A]")
        .replace("<sprite index=66>", "[B]")
        .replace("<sprite index=67>", "[C]")
        .replace("<sprite index=68>", "[D]")
        .replace("<sprite index=69>", "[E]")
        .replace("<sprite index=70>", "[F]")
        .replace("<sprite index=71>", "[G]")
        .replace("<sprite index=72>", "[H]")
        .replace("<sprite index=73>", "[I]")
        .replace("<sprite index=74>", "[J]")
        .replace("<sprite index=75>", "[K]")
        .replace("<sprite index=76>", "[L]")
        .replace("<sprite index=77>", "[M]")
        .replace("<sprite index=78>", "[N]")
        .replace("<sprite index=79>", "[O]")
        .replace("<sprite index=80>", "[P]")
        .replace("<sprite index=81>", "[Q]")
        .replace("<sprite index=82>", "[R]")
        .replace("<sprite index=83>", "[S]")
        .replace("<sprite index=84>", "[T]")
        .replace("<sprite index=85>", "[U]")
        .replace("<sprite index=86>", "[V]")
        .replace("<sprite index=87>", "[W]")
        .replace("<sprite index=88>", "[X]")
        .replace("<sprite index=89>", "[Y]")
        .replace("<sprite index=90>", "[Z]")        // <= END Keyboard EmojiStrMap
        .replace(/<.+?>|^\s+|\r?\n+$|@n|%co1|%coe|%hoe|%rbs|%rbe|%dot/g, '') // htmlTag | trimBeginSpace | trimEndNewLine
        ;
});


//  .replace(/^\s+|\r?\n+$|@n|%co1|%coe|%hoe|%rbs|%rbe|%dot/g, '') // htmlTag | trimBeginSpace | trimEndNewLine