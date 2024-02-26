// ==UserScript==
// @name         [0100A8401A0A8000] Natsumon! 20th Century Summer Vacation
// @version      1.1.0
// @author       [Enfys]
// @description  Yuzu
// * Spike Chunsoft

//*
// ==/UserScript==
const gameVer = '1.1.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+');
const tutorialHandler = trans.send(handler, '250++');


setHook({
    '1.1.0': {
        // [0x82cfea5c - 0x80004000]: mainHandler.bind_(null, 0, "dialog"), // nice spacing
        // [0x833b4148 - 0x80004000]: mainHandler.bind_(null, 1, "all output"), // all text+numbers, too messy
        [0x80db5d34 - 0x80004000]: tutorialHandler.bind_(null, 0, "tutorial"),
        [0x846fa578 - 0x80004000]: mainHandler.bind_(null, 1, "choice"),
        [0x8441e800 - 0x80004000]: mainHandler.bind_(null, 0, "examine + dialog"), // all at once
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;

    let s = address.readUtf16String();

    s = s
        .replace(/[\r\n]+/g, '') // same page new line text combined for translation
        .replace(/(<.+?>)+/g, '\r\n') // new page text gets output on new line for readability

        // tutorial buttons
        .replace(/[]+/g, '(L)')
        .replace(/[]+/g, '(ZL)')

        // .replace(/[]+/g, '(R)')
        .replace(/[]+/g, '(Y)')
        .replace(/[]+/g, '(X)')

        .replace(/[]+/g, '(A)')
        .replace(/[]+/g, '(B)')

        .replace(/[]+/g, '(+)')
        .replace(/[]+/g, '(-)')

        .replace(/[]+/g, '(DPAD_DOWN)')
        .replace(/[]+/g, '(DPAD_LEFT)')
        
        .replace(/[]+/g, '(LSTICK)')
        .replace(/[]+/g, '(L3)')
    ;

    return s;
}