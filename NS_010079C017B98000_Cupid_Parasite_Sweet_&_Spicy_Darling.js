// ==UserScript==
// @name         [010079C017B98000] Cupid Parasite -Sweet & Spicy Darling-
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Otomate & Idea Factory Co., Ltd.
// ==/UserScript==

const gameVer = '1.0.0';
const decoder = new TextDecoder('utf-32');
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x80138150 - 0x80004000]: mainHandler.bind_(null, 2, "name + text"), 
        [0x801a1bf0 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    console.log('onEnter');


    console.log('onEnter: ' + hookname);
    const address = reg.value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf32StringLE()
    s = s.replaceAll(/[\s]/g,'');
    s = s.replaceAll('#KW','');
    s = s.replaceAll('#C(TR,0xff0000ff)','');
    s = s.replace(/【SW】/g,'')
    s = s.replace(/【SP】/g,'')      
    s = s.replace(/#P\(.*\)/g,'');


    return s;
}
