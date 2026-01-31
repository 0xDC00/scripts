// ==UserScript==
// @name         [00040000001B4300] Dragon Ball Heroes: Ultimate Mission X
// @version      1.0
// @author       [Lucasap33]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 5), '200+'); // join 200ms

setHook({
    0x340088: mainHandler, // dialouge only (whole line)
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readShiftJisString();

    // filters
    s = s
		.replace(/\[(.+?)\]/g, '$1') // furigana
		.replace(/\{(.+?)\}/g, '($1)') // furigana
        ;

    return s;
}
