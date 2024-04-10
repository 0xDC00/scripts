// ==UserScript==
// @name         [PCSG00448]  MARGINAL#4 IDOL OF SUPERNOVA 
// @version      0.1
// @author       GO123
// @description  Vita3k
// * Otomate / Rejet
// * Idea Factory Co., Ltd.
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/[\s]/g, '')
        .replace(/(#n)+/g, '') // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')
        .replace(/#Pos\[[\s\S]*?\]/g, '');
    ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200++'); // join 300ms

setHook({

    0x800718f8: mainHandler.bind_(null, 0, 0, "dialogue"),

});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString()

    return s;
}
