// ==UserScript==
// @name         [01008C0016544000] Sea of Stars
// @version      1.0.47140 (If you can't find this version, remove all updates and hook the base game with 0x83e93ca0)
// @author       [Kalleo]
// @description  Yuzu
// * Sabotage Studio
// *
// ==/UserScript==
const gameVer = '1.0.47140';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.47140': {
        [0x820c3fa0 - 0x80004000]: mainHandler.bind_(null, 0, "Main text"), // Use 0x83e93ca0 for the base game (1.0.45861)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter', hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/<[^>]+>/g, ''); // Remove anything inside < >

    return s;
}