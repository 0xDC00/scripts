// ==UserScript==
// @name         [000400000012F500] Tales of the World: Reve Unitia (Japan)
// @version      0.1
// @author       [Gilfar]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 0), '200+'); // join 200ms

setHook({
    0x251aa0: mainHandler, // dialouge only
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf16String();

    // filters
    s = s
        .replace(/(鸚c[0-9]鵡)+/g, '') // color
        .replace(/(\n)+/g, '　') // page break
        ;

    return s;
}