// ==UserScript==
// @name         [0100A1200CA3C000] Chou no Doku Hana no Kusari Taishou Tsuya Koi Ibun 蝶の毒 華の鎖～大正艶恋異聞～
// @version      2.0.1
// @author       [Kalleo]
// @description  Yuzu
// * 株式会社プロトタイプ
// *
// ==/UserScript==
const gameVer = '2.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '2.0.1': {
        [0x80095010 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text + Names"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s
    .replace(/\$d/g, '\n') // Replace $d for line breaks
    .replace(/＿/g, ' ') // Replace _ for spaces
    .replace(/@/g, ' ') // Replace @ for spaces
    .replace(/\[([^\/\]]+)\/[^\/\]]+\]/g, '$1') // Remove furigana [憂鬱/ゆううつ] to 憂鬱
    .replace(/[~^$❝.❞'?,(-)!—:;-❛ ❜]/g, '') // Remove specified symbols
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/^\s+/, '') // Trim spaces if the sentence starts with one
    .replace(/^\s*$/gm, '') // Remove empty lines

    return s;
}