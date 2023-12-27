// ==UserScript==
// @name         [0100B0601852A000] AKA
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Cosmo Gatto
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8166eb80 - 0x80004000]: mainHandler.bind_(null, 0, "main text"), // Main text
        [0x817d44a4 - 0x80004000]: mainHandler.bind_(null, 0, "letter"), // Letter
        [0x815cb0f4 - 0x80004000]: mainHandler.bind_(null, 0, "mission title"), // Mission title
        [0x815cde30 - 0x80004000]: mainHandler.bind_(null, 0, "mission description"), // Mission description
        [0x8162a910 - 0x80004000]: mainHandler.bind_(null, 0, "craft description"), // Craft description
        [0x817fdca8 - 0x80004000]: mainHandler.bind_(null, 0, "inventory item"), // Inventory item name
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}