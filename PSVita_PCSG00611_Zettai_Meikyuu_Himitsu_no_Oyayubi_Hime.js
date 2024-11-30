// ==UserScript==
// @name         [PCSG00611] Zettai Meikyuu Himitsu no Oyayubi Hime
// @version      
// @author       emilybrooks
// @description  Vita3k
// * Karin Entertainment
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler);

setHook({
    0x800bb35e: mainHandler.bind_(null, 5, 0, "text"),
});

function handler(regs, index, name) {
    const address = regs[index].value;
    let text = address.readShiftJisString();
    return text;
}
