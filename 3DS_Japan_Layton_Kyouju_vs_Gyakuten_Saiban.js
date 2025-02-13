// ==UserScript==
// @name         [0004000000078B00] Layton Kyouju vs Gyakuten Saiban (Japan)
// @version      0.1
// @author       [sasuke yo]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 6), '200+'); // join 200ms

setHook({
	0x1c6a38: mainHandler,
});

function handler(regs, index) {
    const address = regs[index].value;
	
    // console.log('onEnter');
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readShiftJisString();

    // filters
    s = s
        .replace(/<[^>]+>/g, '') // control codes
		.replace(/\[([^\/\]]+)\/[^\]]+\]/g, '$1') // removes furigana
		.replace(/>/g, '') // removes '>'
        ;

    return s;
}