// ==UserScript==
// @name         [0100BC0018138000] Super Mario RPG
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Nintendo
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '350+');

setHook({
    '1.0.0': {
        [0x81d78c58 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x81dc9cf8 - 0x80004000]: mainHandler.bind_(null, 0, "Name"),
        [0x81c16b80 - 0x80004000]: mainHandler.bind_(null, 1, "Cutscene"),   
        [0x821281f0 - 0x80004000]: mainHandler.bind_(null, 1, "Special/Item/Menu/Objective Description"),
        [0x81cd8148 - 0x80004000]: mainHandler.bind_(null, 1, "Special Name"),
        [0x81fc2820 - 0x80004000]: mainHandler.bind_(null, 0, "Item Name Battle"),
        [0x81d08d28 - 0x80004000]: mainHandler.bind_(null, 0, "Item Name Off-battle"), 
        [0x82151aac - 0x80004000]: mainHandler.bind_(null, 0, "Shop Item Name"),        
        [0x81fcc870 - 0x80004000]: mainHandler.bind_(null, 1, "Objective Title"),
        [0x821bd328 - 0x80004000]: mainHandler.bind_(null, 0, "Monster List - Name"),
        [0x820919b8 - 0x80004000]: mainHandler.bind_(null, 0, "Monster List - Description"),
        [0x81f56518 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),        
        [0x82134ce0 - 0x80004000]: mainHandler.bind_(null, 0, "Help Category"),
        [0x82134f30 - 0x80004000]: mainHandler.bind_(null, 0, "Help Name"),
        [0x821372e4 - 0x80004000]: mainHandler.bind_(null, 0, "Help Description 1"),
        [0x82137344 - 0x80004000]: mainHandler.bind_(null, 0, "Help Description 2"),
        [0x81d0ee80 - 0x80004000]: mainHandler.bind_(null, 2, "Location"),
        [0x82128f64 - 0x80004000]: mainHandler.bind_(null, 0, "Album Title"),
        [0x81f572a0 - 0x80004000]: mainHandler.bind_(null, 3, "Load/Save Text"),
        [0x81d040a8 - 0x80004000]: mainHandler.bind_(null, 0, "Levelup First Part"),
        [0x81d043fc - 0x80004000]: mainHandler.bind_(null, 0, "Levelup Second Part"), 
        [0x81d04550 - 0x80004000]: mainHandler.bind_(null, 0, "Levelup New Ability Description"),
        [0x81fbfa18 - 0x80004000]: mainHandler.bind_(null, 0, "Yoshi Mini-Game Header"),
        [0x81fbfa74 - 0x80004000]: mainHandler.bind_(null, 0, "Yoshi Mini-Game Text"),
        [0x81cf41b4 - 0x80004000]: mainHandler.bind_(null, 0, "Enemy Special Attacks"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    // Remove opening <> and close </> tags and what is between them (ex: 敵<style=p12>てき</style>) -> Replace some button tags -> Remove < > single tags and anything inside it 
    s = s
    .replace(/<[^>]*>([^<]*)<\/[^>]*>/g, '')
    .replace(/<sprite name=L>/g, 'L')
    .replace(/<sprite name=R>/g, 'R')
    .replace(/<sprite name=A>/g, 'A')
    .replace(/<sprite name=B>/g, 'B')
    .replace(/<sprite name=X>/g, 'X')
    .replace(/<sprite name=Y>/g, 'Y')
    .replace(/<sprite name=PLUS>/g, '+')
    .replace(/<sprite name=MINUS>/g, '-') 
    .replace(/<[^>]+>/g, '');

    return s;
}