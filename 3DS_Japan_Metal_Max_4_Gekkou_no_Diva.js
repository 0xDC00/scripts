// ==UserScript==
// @name         [00040000000AFD00] Metal Max 4 - Gekkou no Diva (Japan)
// @version      1.1
// @author       [Gilfar]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 10), '200+'); // join 200ms
const optionHandler = trans.send(handler.bind_(null, 0), '200+'); // join 200ms

setHook({
    0x248c30: mainHandler, // text
    0x2483c0: optionHandler, // dialouge options
});

function handler(regs, index) {
    const address = regs[index].value;

    //console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf8String();

    // filters
    s = s
        //.replace(/(\<br\>)+/g, ' ') // single line
        .replace(/(\n )+/g, '') // new line
        .replace(/(@w[0-9]+)+/g, '') // wait timers ex. @w30
        ;
    return s;
}