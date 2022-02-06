// ==UserScript==
// @name         [ULJM06036] Princess Evangile Portable
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * 
// *
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler.bind_(null, 2), '200+'); // join 200ms

setHook({
    0x88506d0: mainHandler, // [0x88506d0(2)...0x088507C0(?)] // name text text (line doubled)
});

function handler(regs, index) {
    const address = regs[index].value; // a2

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf16String();

    const patt = /<R([^\/]+).([^>]+)./g;
    // print rubi
    const rubis = s.matchAll(patt);
    for (const rubi of rubis) {
        console.log('rubi', rubi[1]);
        console.log('rube', rubi[2]);
    }
    // remove ruby
    s = s.replace(patt, '$2'); 
    // remove tag (control)
    s = s.replace(/<[A-Z]+>/g, '');

    return s;
}
