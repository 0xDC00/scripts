// ==UserScript==
// @name         [PCSG00389]  バイナリースター Binary Star
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Design Factory Co., Ltd. & Otomate
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

const mainHandler = trans.send(handler, '300+'); // join 300ms

setHook({

    0x80058608: mainHandler.bind_(null, 1, 0, "dialogue"),
    0x80021292: mainHandler.bind_(null, 0, 0, "name"),

});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    //console.log("onEnter: " + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString()

    return s;
}
