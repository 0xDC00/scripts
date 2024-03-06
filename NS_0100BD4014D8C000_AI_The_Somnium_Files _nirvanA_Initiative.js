// ==UserScript==
// @name         [0100BD4014D8C000] AI: The Somnium Files - nirvanA Initiative
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Spike Chunsoft
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, '400');

setHook({
    '1.0.1': {
        [0x8189ae64 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text + Tutorial"),
        [0x81813428 - 0x80004000]: mainHandler.bind_(null, 0, "Hover Investigation Text"),
        [0x82e122b8 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x82cffff8 - 0x80004000]: mainHandler.bind_(null, 0, "Config Description"),
        [0x818c3cd8 - 0x80004000]: mainHandler.bind_(null, 0, "File: Names"),
        [0x82ea1a38 - 0x80004000]: mainHandler.bind_(null, 0, "File: Contents"),
        [0x82cbb1fc - 0x80004000]: mainHandler2.bind_(null, 0, "Investigation Choices"),
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
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/.*?_/g, '') // Remove anything before _
    
    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}