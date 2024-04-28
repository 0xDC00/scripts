// ==UserScript==
// @name         [PCSG00911]  Re:Birthday Song ~Koi o Utau Shinigami~
// @version      0.1
// @author       GO123
// @description  Vita3k
// *honeybee
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/%N/g, '')
        ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200++'); // join 200ms

setHook({

    0x80033af6: mainHandler.bind_(null, 0, 0, "dialogue"),


});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.add(0x2).readShiftJisString()

    return s;
}
