// ==UserScript==
// @name         [0100F7E00DFC8000] Cupid Parasite
// @version      1.0.1
// @author       [zooo]
// @description  Yuzu
// * Otomate
// ==/UserScript==

const gameVer = '1.0.1';
const decoder = new TextDecoder('utf-32');
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.1': {
        [0x80057910 - 0x80004000]: mainHandler.bind_(null, 2, "name + text"), 
        [0x80169df0 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
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
    s = s.replaceAll('#KW','')
    s = s.replaceAll('#C(TR,0xff0000ff)','');

        ;
    return s;

}
