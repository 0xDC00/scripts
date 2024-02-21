// ==UserScript==
// @name         [010043B013C5C000] NEO: The World Ends With You
// @version      1.03
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.03';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.03': {
        [0x81581d6c - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
        [0x818eb248 - 0x80004000]: mainHandler.bind_(null, 0, "Objective"),
        [0x81db84a4 - 0x80004000]: mainHandler.bind_(null, 0, "Menu: Collection Item Name"),
        [0x81db8660 - 0x80004000]: mainHandler.bind_(null, 1, "Menu: Collection Item Description"),
        [0x81c71a48 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Title"),
        [0x81c71b28 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* The text from cutscenes and some UI elements could not be captured.
* Try using an OCR for those parts.
`);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s.replace(/<[^>]*>/g, '') // Remove HTML tags

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}