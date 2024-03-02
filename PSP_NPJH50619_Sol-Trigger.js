// ==UserScript==
// @name         [NPJH50619] Sol Trigger
// @version      1.0.1
// @author       [Enfys]
// @description  PPSSPP x64
// * Imageepoch
// *
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler);
const dialogHandler = trans.send(handler, 200);

setHook({
    0x8952cfc: dialogHandler.bind_(null, 0, 'dialog'),
    0x884aad4: mainHandler.bind_(null, 0, 'description'),
    0x882e1b0: mainHandler.bind_(null, 0, 'system'),
    0x88bb108: mainHandler.bind_(null, 2, 'battle tutorial'),
    0x89526a0: mainHandler.bind_(null, 0, 'battle info'), // only grabs some info

    0x88bcef8: mainHandler.bind_(null, 1, 'battle talk'),
});

console.log("Can't hook skill or item text in battle, but you can view hooked item/skills in the menu.");
let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;

    /* processString */
    const s = address.readUtf8String()
        .replace(/[\r\n]+/g, '') // same page new line text combined for translation
        .replace(/^(.*?)\)+/g,'')
        .replace(/(\#ECL)+/g, '')
        .replace(/(\#.+?\))+/g, '')
    ;

    if (previous === s) return null;
    previous = s;

    return s;
} 