// ==UserScript==
// @name         [00040000000AD900] Dragon Ball Heroes: Ultimate Mission
// @version      1.0
// @author       [Lucasap33]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 0), '200+'); // join 200ms

setHook({
    0x1a8988: mainHandler, // dialogue only
});

function handler(regs, index) {
    const address = regs[index].value;

    //console.log('onEnter');

    /* processString */
    let s = address.readUtf8String();

    // filters
    s = s
		.replace(/\[(.+?)\]/g, '$1') // furigana
		.replace(/\{(.+?)\}/g, '($1)') // furigana
        ;

    return s;
}