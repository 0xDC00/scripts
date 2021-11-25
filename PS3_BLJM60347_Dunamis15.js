// ==UserScript==
// @name         [BLJM60347] Dunamis15
// @version      0.1
// @author       [DC]
// @description  RPCS3
// * Division ZERO & MAGES. GAME
// * 
// ==/UserScript==
const { setHook } = require("./libRPCS3.js");

setHook({
    0x42c90: trans.send(handler, '200') // all text, leading+trailing 200ms (name text text text..)
});

function handler(regs) {
    const address = regs[1].value; // r3 r4 r5... (r4 = arg1)

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf8String();

    // print rubi
    // [うらら]麗 [れんじょう,1]連城 [ダブルムーン,3]二つの月
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
    
    // remove control
    s = s.replace(/\\k|\\x|%C|%B/g, '');
    s = s.replace(/\%\d+\#[0-9a-fA-F]*\;/g, ''); // remove color tag

    return s;
}
