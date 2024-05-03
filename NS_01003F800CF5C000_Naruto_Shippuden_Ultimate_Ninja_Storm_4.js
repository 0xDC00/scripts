// ==UserScript==
// @name         [01003F800CF5C000] Naruto Shippuden: Ultimate Ninja Storm 4 ROAD TO BORUTO
// @version      1.1.0
// @author       [Kalleo]
// @description  Yuzu
// * BANDAI NAMCO
// *
// ==/UserScript==
const gameVer = '1.1.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.1.0': {
        "H66611a418ae83b7f": mainHandler.bind_(null, 0, "Text"),
        "Hd597025f0633a03c": mainHandler.bind_(null, 0, "Tutorial H1"),
        "Heaf3466af7ed1964": mainHandler.bind_(null, 0, "Tutorial H2"),
        "Hd0186e8604174f00": mainHandler.bind_(null, 0, "Tutorial Description"),
        "H54eaba2bd30bece8": mainHandler.bind_(null, 0, "Info"),
        "H7f6b4ea3501a18b5": mainHandler.bind_(null, 0, "Menu"),
        "H286e381144cef8d6": mainHandler.bind_(null, 0, "Mission Title"),
        "Hdb233d1bf801af8e": mainHandler.bind_(null, 0, "Mission Description"),
        "H00755845f7d9d990": mainHandler.bind_(null, 0, "Objective"),
        "Hab331e772ddd8f8e": mainHandler.bind_(null, 0, "Location"),
    }
}, globalThis.gameVer = globalThis.gameVer ?? gameVer);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s.replace(/<[^>]*>/g, '') // Remove HTML tags

    return s;
}
