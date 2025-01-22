// ==UserScript==
// @name         [00040000000C3A00] Devil Survivor 2 Record Breaker (Japan)
// @version      1.1
// @author       [Gilfar]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 0), '200+'); // join 200ms

setHook({
    0x1a2d2c: mainHandler, // dialouge only (whole line)
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readShiftJisString();

    // filters
    s = s
        //.replace(/(\<br\>)+/g, ' ') // single line
        .replace(/(\uFFFD\x40)+/g, '!?') // !? gets mangled
        .replace(/(\<p\>)+/g, '\r\n') // page break
        .replace(/(<.+?>)+/g, ' ') // htmlTag
        ;

    return s;
}