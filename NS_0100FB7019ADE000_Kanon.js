// ==UserScript==
// @name         [0100FB7019ADE000] Kanon
// @version      1.0.0
// @author       [kinyarou]
// @description  Yuzu
// * PROTOTYPE
// * 
//
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

let nEnter = 0;

setHook({
    '1.0.0': {
        [0x800dc524 - 0x80004000]: mainHandler
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    console.log('onEnter');
    if ((++nEnter) % 2 == 1) return null;
    return regs[0].value.readUtf16String();
}