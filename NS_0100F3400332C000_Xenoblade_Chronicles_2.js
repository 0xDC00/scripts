// ==UserScript==
// @name         [0100F3400332C000] Xenoblade Chronicles 2
// @version      2.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Monolith Soft, Nintendo
// *
// ==/UserScript==
const gameVer = '2.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '2.0.2': {
        [0x8010b180 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* This script is only for the main text (cutscenes + press to continue text).

* Any other elements like tutorials, objectives, menu text, etc., could not be captured. 

* Try using an OCR for those parts.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s.replace(/\[.*?\]/g, '') // Remove anything inside []

    return s;
}