// ==UserScript==
// @name         [00040000000F4100] Exstetra (Japan)
// @version      0.1
// @author       [Gilfar]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 1), '200+'); // join 200ms

setHook({
    0x23a8c4: mainHandler, // dialouge
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf16String();

    // filters
    s = s
        .replace(/(#C[0-9])+/g, '') // control codes
        ;

    return s;
}