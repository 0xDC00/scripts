// ==UserScript==
// @name         [010042300C4F6000] Nightshade／百花百狼
// @version      1.0.1
// @author       [zooo]
// @description  Yuzu
// * Red Entertainment Corporation & Lantern Rooms
// ==/UserScript==

//------------------------------------------------
const gameVer = '1.0.1';
const decoder = new TextDecoder('utf-16');
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.1': {
        [0x802999c8 - 0x80004000]: mainHandler.bind_(null, 1, "dialogue"),
        [0x8015b544 - 0x80004000]: mainHandler.bind_(null, 0, "name"), 
        [0x802a2fd4 - 0x80004000]: mainHandler.bind_(null, 1, "choice1"), 
        [0x802b7900 - 0x80004000]: mainHandler.bind_(null, 1, "choice2"), 

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
    s = s.replace(/(.+?\/)/g,'');
    s = s.replace(/(" .*)/g,''); 
    s = s.replace(/^(.+?")/g,''); 

    return s;
}
