// ==UserScript==
// @name         [0100E1E00E2AE000] Hakuouki Shinkai: Tsukikage no Shou / 薄桜鬼 真改 月影ノ抄
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
        [0x8019ecd0 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/#n/g, '\n') // Replace #n for line breaks
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[~^,\-\[\]#]/g, ''); // Remove specified symbols

    return s;
}