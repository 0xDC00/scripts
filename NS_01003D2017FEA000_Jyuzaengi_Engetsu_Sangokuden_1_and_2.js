// ==UserScript==
// @name         [01003D2017FEA000] 十三支演義 偃月三国伝1・2 for Nintendo Switch (Juuzaengi ~Engetsu Sangokuden~)
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// ==/UserScript==
const gameVer = '1.0.0';
const decoder = new TextDecoder('utf-16');
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
        [0x82031f20 - 0x80004000]: mainHandler.bind_(null, 2, 0), // name
        [0x82ef9550 - 0x80004000]: mainHandler.bind_(null, 1, 0), // dialogue 
        [0x83252e0c - 0x80004000]: mainHandler.bind_(null, 0, 0), // choice

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    console.log('onEnter');


    console.log('onEnter: ' + hookname);
    const address = reg.value;

    /* processString */
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/[\s]/g,'');
    return s;
}
