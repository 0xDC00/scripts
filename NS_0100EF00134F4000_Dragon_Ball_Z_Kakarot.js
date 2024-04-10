// ==UserScript==
// @name         [0100EF00134F4000] Dragon Ball Z: Kakarot
// @version      1.50
// @author       [Kalleo]
// @description  Yuzu
// * CyberConnect2, Bandai Namco
// *
// ==/UserScript==
const gameVer = '1.50';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.50': {
        [0x812a8e28 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x812a8c90 - 0x80004000]: mainHandler.bind_(null, 0, "Name"),
        [0x80bfbff0 - 0x80004000]: mainHandler.bind_(null, 0, "Ptc Text"),
        [0x80bfbfd4 - 0x80004000]: mainHandler.bind_(null, 0, "Ptc Name"),
        [0x8126a538 - 0x80004000]: mainHandler.bind_(null, 0, "Info"),
        [0x8106fcbc - 0x80004000]: mainHandler.bind_(null, 0, "More Info"),
        [0x80fad204 - 0x80004000]: mainHandler.bind_(null, 0, "Hint Part1"),
        [0x80fad2d0 - 0x80004000]: mainHandler.bind_(null, 0, "Hint Part2"),
        [0x80facf1c - 0x80004000]: mainHandler.bind_(null, 0, "Loading Title"),
        [0x80fad018 - 0x80004000]: mainHandler.bind_(null, 0, "Loading Description"),
        [0x81250c50 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial h1"),
        [0x81250df0 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial h2"),
        [0x81251e80 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description1"),
        [0x81252214 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description2"),
        [0x810ae1c4 - 0x80004000]: mainHandler.bind_(null, 0, "Config Description"),
        [0x812a9bb8 - 0x80004000]: mainHandler.bind_(null, 0, "Menu Talk"),
        [0x812a9b78 - 0x80004000]: mainHandler.bind_(null, 0, "Menu Name"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s.replace(/<[^>]*>/g, '') // Remove HTML tags

    return s;
}