// ==UserScript==
// @name         [01000EA00D2EE000] Toraware no Paruma -Refrain-
// @version      0.1 - 1.0.0
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
        0x84ff9bc: mainHandler, // text x0
        0x84ff994: mainHandler, // name x0 (0x8696744 (miss), 0x84ff994 (html tag))
        0x8d2aca4: mainHandler, // choice
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const index = 0;
    const address = regs[index].value;
    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = null;
    if (len > 0) {
        s = address.add(0x14).readUtf16String(len);
        s = s.replace(/<.+?>/g, ''); // html tag
        if (s !== 'none') {
            s = s.replace(/\n+/g, ' ');  // single line
        }
        else s = null; // skip empty name
    }

    return s;
}