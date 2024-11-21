// ==UserScript==
// @name         [0004000000112000] Toushin Toshi: Girls Gift RPG (Japan)
// @version      0.1
// @author       [Gilfar]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 2), '200+'); // join 200ms

setHook({
    0x160528: mainHandler, // dialouge only
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0xF0 }));

    /* processString */
    let s = readString(address);

    // filters
    s = s
        .replace(/(\n)+/g, '　') // page break
        ;

    return s;
}

function readString(address) {
    let s = '', c;
    address = address.add(4);
    while ((c = address.readU16()) !== 0x00) {
      s += address.readUtf16String(1);
      address = address.add(6);
    }
    return s;
}