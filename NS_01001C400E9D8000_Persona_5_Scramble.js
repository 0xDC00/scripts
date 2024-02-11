// ==UserScript==
// @name         [01001C400E9D8000] Persona 5 Scramble: The Phantom Strikers
// @version      1.0.3
// @author       [Kalleo]
// @description  Yuzu
// * Atlus, Omega Force, P Studio
// *
// ==/UserScript==
const gameVer = '1.0.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.3': {
        // Main
        [0x806c66e4 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x806d6b7c - 0x80004000]: mainHandler.bind_(null, 0, "Cutscene"),
        [0x80868798 - 0x80004000]: mainHandler.bind_(null, 0, "Action Talk"),
        [0x80728ef4 - 0x80004000]: mainHandler.bind_(null, 0, "Street NPC talk"),
        [0x8070dcd0 - 0x80004000]: mainHandler.bind_(null, 0, "Choices"),
        [0x806c8f70 - 0x80004000]: mainHandler.bind_(null, 0, "Thoughts"),

        // Phone
        [0x807f4c80 - 0x80004000]: mainHandler.bind_(null, 0, "Phone Message"),
        [0x807f6e60 - 0x80004000]: mainHandler.bind_(null, 0, "Phone Message Choice1"),
        [0x807f6d9c - 0x80004000]: mainHandler.bind_(null, 0, "Phone Message Choice2"),

        // Location
        [0x806de8fc - 0x80004000]: mainHandler.bind_(null, 0, "Location1"),
        [0x806dec7c - 0x80004000]: mainHandler.bind_(null, 0, "Location2"),

        // Ability
        [0x80872750 - 0x80004000]: mainHandler.bind_(null, 0, "Skill Name"),
        [0x80872d6c - 0x80004000]: mainHandler.bind_(null, 0, "Skill Description"),

        // Mission/Objective
        [0x808761a8 - 0x80004000]: mainHandler.bind_(null, 0, "Mission"),
        [0x8076ca1c - 0x80004000]: mainHandler.bind_(null, 0, "Objective"),

        // Settings
        [0x80774518 - 0x80004000]: mainHandler.bind_(null, 0, "Settings Name"),
        [0x8077b138 - 0x80004000]: mainHandler.bind_(null, 0, "Settings Description"),

        // Save/Load
        [0x806d7fd0 - 0x80004000]: mainHandler.bind_(null, 0, "Save/Load Message"),
        [0x807737d0 - 0x80004000]: mainHandler.bind_(null, 0, "Save/Load Description"),

        // Miscellaneous
        [0x8072e024 - 0x80004000]: mainHandler.bind_(null, 0, "Aproach Text"),
        [0x80735004 - 0x80004000]: mainHandler.bind_(null, 0, "Info/Skip Text"),
        [0x806d6f00 - 0x80004000]: mainHandler.bind_(null, 0, "Black Screen Text"),
        [0x8076b08c - 0x80004000]: mainHandler.bind_(null, 0, "Acquired Item"),
        [0x806b6518 - 0x80004000]: mainHandler.bind_(null, 0, "Boss Name"),

        // Shop
        [0x80811e28 - 0x80004000]: mainHandler.bind_(null, 0, "Shop Item Name"),
        [0x8080d26c - 0x80004000]: mainHandler.bind_(null, 0, "Shop Item Description"),
        [0x808134d4 - 0x80004000]: mainHandler.bind_(null, 0, "Shop Name"),

        // Sophia's Shop
        [0x8082e8b0 - 0x80004000]: mainHandler.bind_(null, 0, "Sophia's Shop: Item Name"),
        [0x80827de0 - 0x80004000]: mainHandler.bind_(null, 0, "Sophia's Shop: Item Description"),
        [0x80828890 - 0x80004000]: mainHandler.bind_(null, 0, "Sophia's Shop: Item Effect"),

        // Tutorial
        [0x807161e8 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Title"),
        [0x80715440 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description"),
        [0x80847548 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial PopUp Title"),
        [0x80847694 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial PopUp Description"),

        // Menu
        [0x807efaec - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Item Name"),
        [0x807b66e8 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Item Description"),
        [0x807d7000 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Equip Item Description"),
        [0x807d274c - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Persona Name"),
        [0x80739c28 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Persona Skill Name"),
        [0x80739de4 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Persona Skill Description"),
        [0x807acfbc - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Persona Lore"),
        [0x806c0c98 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Band Ability Description"),
        [0x806c0ab8 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Band Ability Name"),
        [0x806c1180 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Band Ability Effect"),

        // Velvet Room
        [0x8075ee38 - 0x80004000]: mainHandler.bind_(null, 0, "Velvet Room: Persona Name"),
        [0x8073d648 - 0x80004000]: mainHandler.bind_(null, 0, "Velvet Room: Persona Skill Name"),
        [0x80737260 - 0x80004000]: mainHandler.bind_(null, 0, "Velvet Room: Persona Skill Description"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();
    
    s = s
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[~^,]/g, ''); // Remove specified symbols
    
    // Prevent from printing duplicate sentences
    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}