// ==UserScript==
// @name         [01005A401D766000] Shinjuku Rashoumon (新宿羅生門 ―Rashomon of Shinjuku―)
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * Karin Entertainment
// * ALTERGEAR
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x80062a74 - 0x80004000]: mainHandler.bind_(null, 0, 'text'),  
        [0x800629f4 - 0x80004000]: mainHandler.bind_(null, 0, 'names'),  
        [0x800ea870 - 0x80004000]: mainHandler.bind_(null, 1, 'choices'), 
        // [0x800ccb60 - 0x80004000]: mainHandler.bind_(null, 1, ), // gets the whole dictionary
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readUtf8String();
    // print rubi
    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi: ' + rubi[3]);
        console.log('rube: ' + rubi[2]);}
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, '$2');
    // remove controls
    s = s.replace(/(\\n)+/g, ' ')
         .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')
         .replace(/<color=.*>(.*)<\/color>/g, '$1');

    return s;
}

