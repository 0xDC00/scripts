// ==UserScript==
// @name         [010028D0148E6000] Sweet Clown ~Gozen San-ji no Okashi na Doukeshi~
// @version      1.0.0, 1.0.2
// @author       [Enfys]
// @description  Yuzu
// * TAKUYO

//*
// ==/UserScript==
const gameVer = '1.0.2';
globalThis.ARM = true;

// Game not displaying correctly on Yuzu
// Issue is unrelated to this script, text should still be correct
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+');
// const choiceHandler = trans.send(handler.bind_(null, 3, 'choice'), '250+');

setHook({
    '1.0.2': {
        0x20dbfc: mainHandler.bind_(null, 0, "dialog"),
        // 0x214978: choiceHandler ,// called 30 something times but contains all choices
        // 0x214930: choiceHandler, // works first call only, after that is access violation accessing 0x26853c73f04
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s;
    if (hookname === 'dialog') {
        s = address.add(0x28).readShiftJisString();
    } else {
        // grab strings for 0x214978, commented out currently
        // s = address.add(0xC).readShiftJisString();
    }

    s = s
        .replace(/{|\/.*?}|\[.*?\]/g, '')
        .replace(/(\\c|\\n)+/g, ' ')
        // .replace(/,.*$/,' ') // clean strings for 0x214978, commented out currently
    ;

    return s;
}