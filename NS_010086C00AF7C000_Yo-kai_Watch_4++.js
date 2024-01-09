// ==UserScript==
// @name         [010086C00AF7C000] Yo-kai Watch 4++
// @version      2.2.0
// @author       [Kalleo]
// @description  Yuzu
// * Level-5
//*
// ==/UserScript==
const gameVer = '2.2.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '2.2.0': {
        [0x80a88080 - 0x80004000]: mainHandler.bind_(null, 1, "All Text"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    //console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    let s = address.readUtf8String()
    s = s
    .replace(/\[([^\]]+)\/[^\]]+\]/g, '$1') // Remove furigana
    .replace(/\s+/g, ' ') // Replace any sequence of whitespace characters with a single space
    .replace(/\\n/g, ' ') // Replace '\n' with a space
    .replace(/<[^>]+>|\[[^\]]+\]/g, ''); // Remove anything within < > or [ ]

    return s;
}