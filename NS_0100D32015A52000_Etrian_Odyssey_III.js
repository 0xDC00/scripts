// ==UserScript==
// @name         [0100D32015A52000] Etrian Odyssey III HD
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
        [0x83787f04 - 0x80004000]: mainHandler.bind_(null, 0, "Text"),
        [0x8206915c - 0x80004000]: mainHandler2.bind_(null, 0, "Config Description"),
        [0x82e6d1d4 - 0x80004000]: mainHandler2.bind_(null, 0, "Class Description"),
        [0x82bf5d48 - 0x80004000]: mainHandler2.bind_(null, 0, "Item Description"),
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