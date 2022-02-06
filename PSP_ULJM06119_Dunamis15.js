// ==UserScript==
// @name         [ULJM06119] Dunamis15
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * Division ZERO & MAGES. GAME
// *
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, '100+'); // join 100ms

setHook({
    0x0891D72C: mainHandler // all
});

function handler(regs) {
    const address = regs[0].value; // a0

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf8String();

    // print rubi
    // 、%0#0077ff77;[おか]陸%0#;から
    const patt = /\[[^\]]+./g;
    const rubis = s.matchAll(patt);
    for (const rubi of rubis) {
        const ruby = rubi[0];
        const n = parseInt(rubi.match(/\d+\]$/) ?? 0) + 1;
        let q = ruby.indexOf(',');
        q = q !== -1 ? q : ruby.length-2;
        console.log('rubi', ruby.substring(1, q));
        console.log('rube', s.substr(rubi.index + ruby.length, n));
    }

    // remove rubi
    s = s.replace(patt, '');

    // remove tag (control)
    s = s.replace(/\\k|\\x|%C|%B/g, '');
    s = s.replace(/\%\d+\#[0-9a-fA-F]*\;/g, ''); // remove color tag

    s = s.replace(/\n+/g, ' '); // single line

    return s;
}
