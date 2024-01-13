// ==UserScript==
// @name         [0100E390145C8000] Koroshiya to Strawberry- Plus
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Broccoli
// ==/UserScript==

//------------------------------------------------
const gameVer = '1.0.0';
const decoder = new TextDecoder('utf-16');
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x81322cec - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"),
        [0x819b1a78 - 0x80004000]: mainHandler.bind_(null, 2, "name"), 
        [0x81314e8c - 0x80004000]: mainHandler.bind_(null, 0, "choice"), 

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    console.log('onEnter');


    console.log('onEnter: ' + hookname);
    const address = reg.value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/[\s]/g,'');
    s = s.replace(/(" .*)/g,''); 
    s = s.replace(/^(.+?")/g,''); 

    return s;
}
