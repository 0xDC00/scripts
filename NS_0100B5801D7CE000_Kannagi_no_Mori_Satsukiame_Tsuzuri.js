// ==UserScript==
// @name         [0100B5801D7CE000] Kannagi no Mori Satsukiame Tsuzuri
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// *Matatabi
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, "200+");

setHook({
    '1.0.0': {
        [0x8205e150 - 0x80004000]: mainHandler.bind_(null, 0, 0, "dialogue"),
        [0x820e2e6c - 0x80004000]: mainHandler.bind_(null, 0, 0, "choices"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);
    // console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.add(0x14).readUtf16String();
    
    if (hookname === "dialogue") {
        s = s.replace(/\n/g, '');
    }

return s;
}
