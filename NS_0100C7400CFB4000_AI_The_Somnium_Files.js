// ==UserScript==
// @name         [0100C7400CFB4000] AI: The Somnium Files
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Spike Chunsoft
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);
const mainHandler3 = trans.send(handler, 200);

setHook({
    '1.0.2': {
        [0x8165a9a4 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text + Tutorial"),
        [0x80320dd4 - 0x80004000]: mainHandler2.bind_(null, 1, "Menu Interface Text1"),
        [0x80320e20 - 0x80004000]: mainHandler3.bind_(null, 1, "Menu Interface Text2"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/\d/g, '') // Remove Numbers
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/^\s*$/gm, ''); // Remove empty lines
    
    // Prevent from printing duplicate sentences
    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}