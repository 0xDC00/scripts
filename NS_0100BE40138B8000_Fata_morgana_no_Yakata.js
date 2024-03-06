// ==UserScript==
// @name         [0100BE40138B8000] Fata morgana no Yakata ~Dreams of the Revenants Edition~ / ファタモルガーナの館
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * HuneX
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, 200);
const mainHandler2 = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x8025a998 - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x801d6050 - 0x80004000]: mainHandler2.bind_(null, 0, "Choices"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* The intro can't be hooked, probably because it's a video.
* Try using an OCR for that part.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags

    return s;
}