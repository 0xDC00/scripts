// ==UserScript==
// @name         [010044800D2EC000] Toraware no Paruma
// @version      1.0.0
// @author       [DC]
// @description  Yuzu
// * Capcom
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+');

setHook({
    '1.0.0': {
        [0x8015b7a8 - 0x80004000]: mainHandler.bind_(null, 0), // text x0
        [0x8015b46c - 0x80004000]: mainHandler.bind_(null, 1), // name x1
        // choice?
        // alert?
        // prompt?
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index) {
    const address = regs[index].value;
    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = null;
    if (len > 0) {
        s = address.add(0x14).readUtf16String(len);
        s = s.replace(/\n+/g, ' ');  // single line
        s = s.replace(/\<PL_N\>/g, '???'); // name
        s = s.replace(/<.+?>/g, ''); // html tag
    }

    return s;
}