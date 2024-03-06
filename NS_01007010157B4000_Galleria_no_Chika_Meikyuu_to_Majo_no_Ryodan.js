// ==UserScript==
// @name         [01007010157B4000] Galleria no Chika Meikyuu to Majo no Ryodan ガレリアの地下迷宮と魔女ノ旅団
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * 日本一ソフトウェア
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x8002f64c - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
1* This script is only for the main text, any other UI element will not be captured.
2* The intro (Black screen and white text) could not be hooked. Try using an OCR for that part.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    return s;
}