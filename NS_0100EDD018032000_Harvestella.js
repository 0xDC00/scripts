// ==UserScript==
// @name         [0100EDD018032000] Harvestella
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x80af7abc - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x80c0beb8 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial + News"),
        [0x80b87f94 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Part 2"),
        [0x80e1c378 - 0x80004000]: mainHandler.bind_(null, 0, "Mission Title"),
        [0x80a7d7f4 - 0x80004000]: mainHandler.bind_(null, 0, "Mission Description"),
        [0x80e39130 - 0x80004000]: mainHandler.bind_(null, 0, "Item Name"),
        [0x80e38f80 - 0x80004000]: mainHandler.bind_(null, 0, "Item Description Part1"),
        [0x80e38ea8 - 0x80004000]: mainHandler.bind_(null, 0, "Item Description Part2"),   
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* Some UI elements could not be captured.
* Try using an OCR for those parts.
`);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    if (s === previous) {
        return;
    }
    previous = s;
    
    return s;
}