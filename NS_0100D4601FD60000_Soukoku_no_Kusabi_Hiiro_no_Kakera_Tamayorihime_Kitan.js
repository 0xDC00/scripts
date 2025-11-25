// ==UserScript==
// @name         [0100D4601FD60000] Soukoku no Kusabi ~Hiiro no Kakera Tamayori-hime Kitan~ for Nintendo Switch 
// @version      1.0.0
// @author       kenzy
// @description  Yuzu forks, Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.

// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');
const subHandler = trans.send(handler, '300+');

setHook({
    '1.0.0': {
       [0x832c2e28 - 0x80004000]: mainHandler.bind_(null, 0, 'text'),      
       [0x82a631f8 - 0x80004000]: mainHandler.bind_(null, 0, 'dict '), 
       [0x829e6d48 - 0x80004000]: mainHandler.bind_(null, 0, 'dict popup'),
       [0x831ff428 - 0x80004000]: subHandler.bind_(null, 0, 'choices'), 
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {    
    const address = regs[index].value;

    // console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.add(0x14).readUtf16String()
        s = s.replace(/\u3000+/g, '') 
             .replace(/[\r\n]+/g, '')
             .replace(/<br>|\\n/g, '')
             .replace(/<color=.*?>(.*?)<\/color>/g, '$1');        

    return s;
}
