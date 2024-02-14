// ==UserScript==
// @name         [0100BD7015E6C000] Kiss Bell - Let's sound the kissing-bell of the promise / キスベル
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * 株式会社エンターグラム
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8049d958 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/@n/g, '\n') // Replace @n for line breaks
    .replace(/@[a-zA-Z]/g, '') // Remove any @letter
    .replace(/@[^@]+@/g, '') // Remove text between @

    return s;
}