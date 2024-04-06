// ==UserScript==
// @name         [010060800B7A8000] BUSTAFELLOWS
// @version      1.1.3
// @author       [Owlie]
// @description  Yuzu
// *   Extend
// *
// ==/UserScript==
const gameVer = '1.1.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.1.3': {
        [0x80191b18 - 0x80004000]: mainHandler.bind_(null, 0, "Dialogue"),
        [0x80191f88 - 0x80004000]: mainHandler.bind_(null, 0, "Choice"),
        [0x801921a4 - 0x80004000]: mainHandler.bind_(null, 0, "Choice 2"),
        [0x801935f0 - 0x80004000]: mainHandler.bind_(null, 0, "option"),
    }
        
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ' + hookname);
    const address = regs[index].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');
    s = s.replace(/#n/g, '');
    return s;
}







