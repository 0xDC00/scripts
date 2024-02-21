// ==UserScript==
// @name         [01008A3016162000] Etrian Odyssey I HD
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Atlus
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, 200);
const mainHandler2 = trans.send(handler, '400+');

setHook({
    '1.0.2': {
        [0x82d57550 - 0x80004000]: mainHandler.bind_(null, 0, "Text"),
        [0x824ff408 - 0x80004000]: mainHandler2.bind_(null, 0, "Config Description"),
        [0x8296b4e4 - 0x80004000]: mainHandler2.bind_(null, 0, "Class Description"),
        [0x81b2204c - 0x80004000]: mainHandler2.bind_(null, 0, "Item Description"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* If you don't get text, try attaching the game when it's launching (Before it starts)
`);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}