// ==UserScript==
// @name         [01001C1009892000] The World Ends with You: Final Remix
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, -200);

setHook({
    '1.0.0': {
        [0x80706ab8 - 0x80004000]: mainHandler.bind_(null, 2, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s.replace(/\[.*?\]/g, ''); // Remove anything inside []

    return s;
}