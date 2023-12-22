// ==UserScript==
// @name         [PCSG00696] Angelique Retour
// @version      0.1
// @author       [zooo]
// @description  Vita3k
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replace(/㌔/g, '⁉')
        .replace(/㍉/g, '!!')
        ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
    0x8008bd1a: mainHandler.bind_(null, 1, 0, "text1"),
    0x8008cd48: mainHandler.bind_(null, 0, 0, "text2"),
    0x8008f75a: mainHandler.bind_(null, 0, 0, "choice"),
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString();


    return s;
}
