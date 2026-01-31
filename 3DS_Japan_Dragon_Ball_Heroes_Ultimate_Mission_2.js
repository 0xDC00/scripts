// ==UserScript==
// @name         [0004000000120600] Dragon Ball Heroes: Ultimate Mission 2
// @version      1.0
// @author       [Lucasap33]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 5), '200+'); // join 200ms

setHook({
    0x345644: mainHandler, // dialouge only (whole line)
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf8String();

    // filters
    s = s
		.replace(/\[(.+?)\]/g, '$1') // furigana
		.replace(/\{(.+?)\}/g, '($1)') // furigana
        ;

    return s;
}
