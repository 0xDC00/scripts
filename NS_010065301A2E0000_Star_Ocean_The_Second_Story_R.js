// ==UserScript==
// @name         [010065301A2E0000] Star Ocean The Second Story R
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix, Gemdrops
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.2': {
        // Main
        [0x81d5e4d0 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text + Tutorial"), 
        [0x81d641b4 - 0x80004000]: mainHandler.bind_(null, 0, "Intro Cutscene"), 

        // Character Selection
        [0x824b1f00 - 0x80004000]: mainHandler.bind_(null, 0, "Character Selection Name"),
        [0x81d4c670 - 0x80004000]: mainHandler.bind_(null, 0, "Character Selection Lore"),

        // Miscellaneous
        [0x8203a048 - 0x80004000]: mainHandler.bind_(null, 0, "General Description"),
        [0x82108cd0 - 0x80004000]: mainHandler.bind_(null, 1, "Unique Spot Title"),
        [0x827a9848 - 0x80004000]: mainHandler.bind_(null, 0, "Chest Item"),
        [0x82756890 - 0x80004000]: mainHandler.bind_(null, 1, "Info"),
        [0x82241410 - 0x80004000]: mainHandler.bind_(null, 0, "Menu Talk"),
        [0x81d76404 - 0x80004000]: mainHandler.bind_(null, 0, "Secondary Talk"),

        // Location
        [0x821112e0 - 0x80004000]: mainHandler.bind_(null, 0, "Location"),
        [0x82111320 - 0x80004000]: mainHandler.bind_(null, 0, "Location Interior"),

        // Special Arts/Spells (必殺技/紋章術)
        [0x81d6ea24 - 0x80004000]: mainHandler.bind_(null, 1, "Special Arts/Spells Name"),
        [0x81d6ea68 - 0x80004000]: mainHandler.bind_(null, 0, "Special Arts/Spells Description"),
        [0x81d6ed48 - 0x80004000]: mainHandler.bind_(null, 0, "Special Arts/Spells Range"),
        [0x81d6eb3c - 0x80004000]: mainHandler.bind_(null, 0, "Special Arts/Spells Effect"),
        [0x81d6f880 - 0x80004000]: mainHandler.bind_(null, 0, "Special Arts/Spells Bonus"),

        // Tactics (戦術)
        [0x8246d81c - 0x80004000]: mainHandler.bind_(null, 0, "Tactics Name"),
        [0x8246d83c - 0x80004000]: mainHandler.bind_(null, 0, "Tactics Description"),

        // Achievements (実績)
        [0x8212101c - 0x80004000]: mainHandler.bind_(null, 0, "Achievements Name"),
        [0x82121088 - 0x80004000]: mainHandler.bind_(null, 0, "Achievements Description"),  

        // Acquired Items
        [0x81d6c480 - 0x80004000]: mainHandler.bind_(null, 0, "Acquired Item1"),
        [0x821143f0 - 0x80004000]: mainHandler.bind_(null, 0, "Acquired Item2"),

        // Battle Skill (バトルスキル)
        [0x81d6fb18 - 0x80004000]: mainHandler.bind_(null, 1, "Battle Skill Name"),
        [0x81d6fb4c - 0x80004000]: mainHandler.bind_(null, 0, "Battle Skill Description"),
        [0x81d6fb7c - 0x80004000]: mainHandler.bind_(null, 0, "Battle Skill Bonus Description"),
        
        // Battle
        [0x8212775c - 0x80004000]: mainHandler.bind_(null, 0, "Battle Item Name"),
        [0x82127788 - 0x80004000]: mainHandler.bind_(null, 0, "Battle Item Description"),
        [0x821361ac - 0x80004000]: mainHandler.bind_(null, 0, "Battle Ability Name"),
        [0x821361f4 - 0x80004000]: mainHandler.bind_(null, 0, "Battle Ability Range"),
        [0x82136218 - 0x80004000]: mainHandler.bind_(null, 0, "Battle Ability Effect"),
        [0x8238451c - 0x80004000]: mainHandler.bind_(null, 0, "Battle Strategy Name"),
        [0x82134610 - 0x80004000]: mainHandler.bind_(null, 0, "Battle Acquired Item"),

        // Item (アイテム)
        [0x824b5eac - 0x80004000]: mainHandler.bind_(null, 0, "Item Name"),
        [0x824b5f04 - 0x80004000]: mainHandler.bind_(null, 0, "Item Description"),
        [0x824b5f54 - 0x80004000]: mainHandler.bind_(null, 0, "Item Effect"), 
        [0x81d71790 - 0x80004000]: mainHandler.bind_(null, 0, "Item Factor Title"),
        [0x824b62c0 - 0x80004000]: mainHandler.bind_(null, 0, "Item Factor Description"),

        // IC/Specialty Skills (IC/特技スキル)
        [0x824c2e2c - 0x80004000]: mainHandler.bind_(null, 1, "IC/Specialty Skills Name"),
        [0x824c2e54 - 0x80004000]: mainHandler.bind_(null, 0, "IC/Specialty Skills Description"),
        [0x824c2fbc - 0x80004000]: mainHandler.bind_(null, 1, "IC/Specialty Skills Level"),

        // IC/Specialty (IC/特技)
        [0x823e7230 - 0x80004000]: mainHandler.bind_(null, 0, "IC/Specialty Name"),
        [0x823e94bc - 0x80004000]: mainHandler.bind_(null, 0, "IC/Specialty Description"),
        [0x823e9980 - 0x80004000]: mainHandler.bind_(null, 0, "IC/Specialty Talent"),
        [0x823ea9c4 - 0x80004000]: mainHandler.bind_(null, 0, "IC/Specialty Support Item"),

        // Enemy Info (エネミー図鑑)
        [0x82243b18 - 0x80004000]: mainHandler.bind_(null, 1, "Enemy Info Skills"),

        // Guild Mission (ギルドミッション)
        [0x81d64540 - 0x80004000]: mainHandler.bind_(null, 0, "Guild Mission Description"),
        [0x823b4f6c - 0x80004000]: mainHandler.bind_(null, 0, "Guild Mission Reward"),

        // Challenge Mission (チャレンジミッション)
        [0x826facd8 - 0x80004000]: mainHandler.bind_(null, 0, "Challenge Mission Description"),
        [0x826f98f8 - 0x80004000]: mainHandler.bind_(null, 0, "Challenge Mission Reward"),

        // Formation (隊列)
        [0x8244af2c - 0x80004000]: mainHandler.bind_(null, 0, "Formation Name"),
        [0x8244ae90 - 0x80004000]: mainHandler.bind_(null, 0, "Formation Description"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    
    s = s
    .replace(/<WaitFrame>\d+<\/WaitFrame>/g, '') // Remove <WaitFrame> tag and its content
    .replace(/<[^>]*>/g, ''); // Remove HTML tags

    return s;
}