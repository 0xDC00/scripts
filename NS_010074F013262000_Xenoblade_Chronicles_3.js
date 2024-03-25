// ==UserScript==
// @name         [010074F013262000] Xenoblade Chronicles 3
// @version      2.2.0
// @author       [Kalleo]
// @description  Yuzu
// * Monolith Soft, Nintendo
// *
// ==/UserScript==
const gameVer = '2.2.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '2.2.0': {
        [0x80cf6ddc - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x80e76150 - 0x80004000]: mainHandler.bind_(null, 0, "Secondary Text"),
        [0x807b4ee4 - 0x80004000]: mainHandler.bind_(null, 1, "Tutorial Description"),
        [0x80850218 - 0x80004000]: mainHandler.bind_(null, 0, "Objective"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* Xenoblade games are not so easily hookable, so a lot of text elements can't be captured.

* The dialogs when the characters are in action could not be captured, but all the cutscenes and press to continue text seems to be working fine.

* You'll also notice that if a tutorial have multiple pages, only the first one will be captured.

* Some other elements like menu, item description, skills and etc.. also could not be captured. 

* For those texts, try using a OCR if you need it.
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