// ==UserScript==
// @name         [010045C014650000] 13 Sentinels: Aegis Rim
// @version      0.1 - 1.0.0
// @author       Koukdw
// @description  Yuzu
// * Vanillaware
// * ATLUS
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x80057d18 - 0x80004000]: mainHandler.bind_(null, 0, "cutscene text"), // cutscene text
        [0x8026fec0 - 0x80004000]: mainHandler.bind_(null, 1, "prompt"), // prompt
        [0x8014eab4 - 0x80004000]: mainHandler.bind_(null, 0, "name (combat)"), // name (combat)
        [0x801528ec - 0x80004000]: mainHandler.bind_(null, 3, "dialogue (combat)"), // dialogue (combat)
        [0x80055b34 - 0x80004000]: mainHandler.bind_(null, 0, "name 2 (speech bubble)"), // name 2 (speech bubble)
        [0x8005ed38 - 0x80004000]: mainHandler.bind_(null, 3, "dialogue 2 (speech bubble)"), // dialogue 2 (speech bubble)
        [0x802679c8 - 0x80004000]: mainHandler.bind_(null, 1, "notification"), // notification
        [0x8025e210 - 0x80004000]: mainHandler.bind_(null, 2, "scene context"), // scene context example: 数日前 咲良高校 １年Ｂ組 教室 １９８５年５月"
        [0x8005c518 - 0x80004000]: mainHandler.bind_(null, 0, "game help"), // game help
        //[0x801bc87c - 0x80004000]: mainHandler.bind_(null, 1), // attack description not working 
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter ' + hookname);

    const address = regs[index].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const s = address.readUtf8String()
        .replace(/(@(\/)?[a-zA-Z#](\(\d+\))?|)+|[\*<>]+/g, '')
        ;

    return s;
}