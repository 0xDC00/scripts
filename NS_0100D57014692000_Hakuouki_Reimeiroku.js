// ==UserScript==
// @name         [0100D57014692000] Hakuouki Reimeiroku (薄桜鬼　黎明録)
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');
const subHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x8002e94c - 0x80004000]: mainHandler.bind_(null, 0, "text"),
       // [0x8002e684 - 0x80004000]: mainHandler.bind_(null, 0, "names"),
        [0x8004c3f4 - 0x80004000]: subHandler.bind_(null, 1, "choices"),
        [0x8005389c - 0x80004000]: subHandler.bind_(null, 0, "dict popup"),
        [0x80059b68 - 0x80004000]: subHandler.bind_(null, 0, "dict menu"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
   // console.log('onEnter: ' + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readUtf8String();
    s = s.replace(/(#n)+/g, ' ')
         .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')

return s;
}
