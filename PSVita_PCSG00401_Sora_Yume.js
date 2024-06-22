// ==UserScript==
// @name         [PCSG00401]  Sora*yume
// @version      0.1
// @author       GO123
// @description  Vita3k
// *TAKUYO
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/[\s]/g, '')
        .replaceAll(/\c/g, '')
        .replaceAll(/\\n/g, '')
        ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({

    0x8000bad4: mainHandler.bind_(null, 1, 0, "dialogue"),


});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    //console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString()

    return s;
}
