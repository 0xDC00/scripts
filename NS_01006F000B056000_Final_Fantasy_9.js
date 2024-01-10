// ==UserScript==
// @name         [01006F000B056000] Final Fantasy IX
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);

setHook({
    '1.0.1': {
        [0x80034b90 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
        [0x802ade64 - 0x80004000]: mainHandler.bind_(null, 0, "Battle Text"),
        [0x801b1b84 - 0x80004000]: mainHandler.bind_(null, 0, "Descriptions"),
        [0x805aa0b0 - 0x80004000]: mainHandler.bind_(null, 0, "Key Item Name"),
        [0x805a75d8 - 0x80004000]: mainHandler.bind_(null, 0, "Key Item Content"), 
        [0x8002f79c - 0x80004000]: mainHandler2.bind_(null, 0, "Menu"),
        [0x80ca88b0 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial1"),
        [0x80ca892c - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial2"),
        [0x80008d88 - 0x80004000]: mainHandler.bind_(null, 1, "Location"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    
    // Remove anything inside []
    s = s.replace(/\[.*?\]/g, '');
    
    return s;
}