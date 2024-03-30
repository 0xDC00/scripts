// ==UserScript==
// @name         [0100CC401A16C000] Ys X: Nordics
// @version      1.0.4
// @author       [Kalleo]
// @description  Yuzu
// * Nihon Falcom
// *
// ==/UserScript==
const gameVer = '1.0.4';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.4': {
        [0x80817758 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
        [0x80981e3c - 0x80004000]: mainHandler.bind_(null, 0, "Secondary Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* Attach the script when it's in the "Launching" screen so it can grab all necessary hooks
`);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\d+/g, '') // Remove Numbers

    if (s === '') return null;

    if (s === previous) {
        return;
    }
    previous = s;
    
    return s;
}