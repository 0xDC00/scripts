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
        0x8057d18: mainHandler.bind_(null, 0, "cutscene text"), // cutscene text
        0x826fec0: mainHandler.bind_(null, 1, "prompt"), // prompt
        0x814eab4: mainHandler.bind_(null, 0, "name (combat)"), // name (combat)
        0x81528ec: mainHandler.bind_(null, 3, "dialogue (combat)"), // dialogue (combat)
        0x8055b34: mainHandler.bind_(null, 0, "name 2 (speech bubble)"), // name 2 (speech bubble)
        0x805ed38: mainHandler.bind_(null, 3, "dialogue 2 (speech bubble)"), // dialogue 2 (speech bubble)
        0x82679c8: mainHandler.bind_(null, 1, "notification"), // notification
        0x825e210: mainHandler.bind_(null, 2, "scene context"), // scene context example: 数日前 咲良高校 １年Ｂ組 教室 １９８５年５月"
        0x805c518: mainHandler.bind_(null, 0, "game help"), // game help
        //0x81bc87c: mainHandler.bind_(null, 1), // attack description not working 
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