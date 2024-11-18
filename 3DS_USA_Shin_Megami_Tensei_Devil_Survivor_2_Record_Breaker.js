// ==UserScript==
// @name         [0004000000159500] Shin Megami Tensei: Devil Survivor 2 Record Breaker (USA)
// @version      0.1
// @author       [DC]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 0), '200+'); // join 200ms

setHook({
    0x001a24c8: mainHandler, // dialouge only (whole line)
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
        .replace(/(\<p\>)+/g, '\r\n') // page break
        .replace(/(<.+?>)+/g, ' ') // htmlTag
        ;

    s = full2Half(s);

    return s;
}

function full2Half(chars) {
    var ascii = '';
    for (var i = 0, l = chars.length; i < l; i++) {
        var c = chars[i].charCodeAt(0);

        // make sure we only convert half-full width char
        if (c >= 0xFF00 && c <= 0xFFEF) {
            c = 0xFF & (c + 0x20);
        }
        else if (c === 0x3000) {
            c = 0x20;
        }

        ascii += String.fromCharCode(c);
    }

    return ascii;
}