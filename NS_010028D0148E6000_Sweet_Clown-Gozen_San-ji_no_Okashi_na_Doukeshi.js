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

const mainHandler = trans.send(handler, '250+');

setHook({
    '1.0.2': {
        0x20dbfc: mainHandler
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;

    let s = address.add(0x28).readShiftJisString();
     s = s
        .replace(/{|\/.*?}|\[.*?\]/g, '')
        .replace(/(\\c|\\n)+/g, ' ')
    ;

    return s;
}