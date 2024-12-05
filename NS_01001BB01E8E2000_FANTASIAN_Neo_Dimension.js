// ==UserScript==
// @name         [01001BB01E8E2000] FANTASIAN Neo Dimension
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu/Ryujinx
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x81719ea0 - 0x80004000]: mainHandler.bind_(null, 0, "Text"),      
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s.replace(/<[^>]*>/g, ''); // Remove HTML tags

    return s;
}