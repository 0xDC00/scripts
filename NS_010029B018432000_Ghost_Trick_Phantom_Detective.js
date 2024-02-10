// ==UserScript==
// @name         [010029B018432000] Ghost Trick: Phantom Detective
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * CAPCOM
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -150);

setHook({
    '1.0.0': {
        [0x81448898 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x80c540d4 - 0x80004000]: mainHandler.bind_(null, 0, "Secondary Text"),
        [0x80e50dd4 - 0x80004000]: mainHandler.bind_(null, 0, "Object Name"),
        [0x80f91c08 - 0x80004000]: mainHandler.bind_(null, 0, "Language Selection"),
        [0x805c9014 - 0x80004000]: mainHandler2.bind_(null, 0, "Story/Character Info"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();
    
    s = s
    .replace(/<[^>]*>/g, ''); // Remove HTML tags

    // Prevent from printing duplicate sentences
    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}