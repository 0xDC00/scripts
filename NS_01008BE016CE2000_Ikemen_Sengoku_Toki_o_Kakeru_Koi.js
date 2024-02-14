// ==UserScript==
// @name         [01008BE016CE2000] Ikemen Sengoku Toki o Kakeru Koi / イケメン戦国◆時をかける恋　新たなる出逢い
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * アイディアファクトリー株式会社
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x813e4fb4 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x813e4c60 - 0x80004000]: mainHandler.bind_(null, 0, "Name"),
        [0x813b5360 - 0x80004000]: mainHandler.bind_(null, 0, "Choices"),
        [0x81bab9ac - 0x80004000]: mainHandler.bind_(null, 1, "Info"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    return s;
}