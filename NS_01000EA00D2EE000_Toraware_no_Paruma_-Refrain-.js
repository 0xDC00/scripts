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
        0x8697300: mainHandler, // text x1
        0x86f43c0: mainHandler, // name x0
        0x8d2aca4: mainHandler, // choice x0
        0x84b04c8: mainHandler, // alert x0
        0x84b725c: mainHandler, // prompt x0
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const index = this.context.pc == 0x8697300 ? 1 : 0;
    const address = regs[index].value;
    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = null;
    if (len > 0) {
        s = address.add(0x14).readUtf16String(len);
        s = s.replace(/\n+/g, ' ');  // single line
        s = s.replace(/\<PL_Namae\>/g, '???'); // name
        s = s.replace(/\<chiaki_washa\>/g, 'chiaki_washa');
        s = s.replace(/<.+?>/g, ''); // html tag
    }

    return s;
}