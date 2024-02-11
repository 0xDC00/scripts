// ==UserScript==
// @name         [0100DE701446A000] Akiba's Trip: Hellbound & Debriefed
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Acquire
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);

setHook({
    '1.0.1': {
        //Main
        [0x824f56a0 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x824b3160 - 0x80004000]: mainHandler.bind_(null, 0, "Secondary Text"),
        [0x824570cc - 0x80004000]: mainHandler.bind_(null, 0, "Intro Roll Text"),
        [0x82571730 - 0x80004000]: mainHandler2.bind_(null, 0, "Aproach Text"),

        //Menu
        [0x825c6660 - 0x80004000]: mainHandler.bind_(null, 0, "Menu Selection"),
        [0x82573638 - 0x80004000]: mainHandler.bind_(null, 0, "Menu Text"),
        [0x823e1230 - 0x80004000]: mainHandler.bind_(null, 0, "Main Screen Text"),
        [0x823e05c4 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),

        // Chracter Creation
        [0x823e1c28 - 0x80004000]: mainHandler.bind_(null, 0, "Character Creation Header title1"),
        [0x823e1c40 - 0x80004000]: mainHandler.bind_(null, 1, "Character Creation Header title2"),
        [0x823e1ca0 - 0x80004000]: mainHandler.bind_(null, 0, "Character Creation Text1"),
        [0x823e1cb8 - 0x80004000]: mainHandler.bind_(null, 1, "Character Creation Text2"),

        // Location
        [0x82567580 - 0x80004000]: mainHandler2.bind_(null, 1, "Location"),
        [0x825d178c - 0x80004000]: mainHandler.bind_(null, 0, "Location Selection"),

        // Phone - Apps
        [0x824e1d80 - 0x80004000]: mainHandler.bind_(null, 0, "Phone App Name"),
        
        // Phone - プロフ
        [0x82532b2c - 0x80004000]: mainHandler.bind_(null, 0, "Profile: Content"),

        // Phone - 図鑑
        [0x824e83ec - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Clothes Name"),
        [0x824ecba0 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Clothes Description"),
        [0x824e8740 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Weapon Name"),
        [0x824ebce0 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Weapon Description1"),
        [0x824ecc74 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Weapon Description2"),
        [0x824e90d4 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Item Name"),
        [0x824ebb68 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Item Description1"),
        [0x824ed090 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Item Description2"),
        [0x824e94f4 - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Name Title"),
        [0x824eb7ec - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Name Description"),
        [0x824ebe6c - 0x80004000]: mainHandler.bind_(null, 0, "Zukan: Skill Description"),

        // Phone - TODO
        [0x82538e58 - 0x80004000]: mainHandler.bind_(null, 0, "TODO: Mission Name1"),
        [0x82536c64 - 0x80004000]: mainHandler.bind_(null, 0, "TODO: Mission Name2"),
        [0x82537238 - 0x80004000]: mainHandler.bind_(null, 0, "TODO: Mission Client"),
        [0x82536f04 - 0x80004000]: mainHandler.bind_(null, 0, "TODO: Mission Description"),
        
        // Phone - メール
        [0x824f5ca0 - 0x80004000]: mainHandler.bind_(null, 0, "Mail: Title"),
        [0x824dd23c - 0x80004000]: mainHandler.bind_(null, 0, "Mail: Content"),

        // Phone - ノート
        [0x824e3f94 - 0x80004000]: mainHandler.bind_(null, 0, "Note: Content1"),
        [0x824e4378 - 0x80004000]: mainHandler.bind_(null, 0, "Note: Content2"),
        [0x824e43a0 - 0x80004000]: mainHandler.bind_(null, 0, "Note: Description"),

        // Phone - アイテム
        [0x824d3424 - 0x80004000]: mainHandler.bind_(null, 0, "Item: Item Name"),
        [0x824d6e88 - 0x80004000]: mainHandler.bind_(null, 0, "Item: Item Description"),

        // Phone - ぽつり
        [0x8252eebc - 0x80004000]: mainHandler2.bind_(null, 0, "Potsuri: Messages"),

        // Shop
        [0x825ea3a8 - 0x80004000]: mainHandler.bind_(null, 0, "Shop: Item Name"),
        [0x825ef4ac - 0x80004000]: mainHandler.bind_(null, 0, "Shop: Item Description"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/ \+ /g, '') // Remove " + "
    .replace(/"([^"]*)"/g, '$1') // Remove ""
    .replace(/\[.*?\]/g, '') // Remove anything inside []
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[~^,]/g, '') // Remove specified symbols
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    // Prevent from printing duplicate sentences
    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}