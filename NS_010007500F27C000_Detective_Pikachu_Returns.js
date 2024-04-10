// ==UserScript==
// @name         [010007500F27C000] Detective Pikachu Returns
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Nintendo
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '600+');

setHook({
    '1.0.0': {
        [0x81585750 - 0x80004000]: mainHandler.bind_(null, 2, "All Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/^(?:決定|進む|ページ移動|ノート全体図|閉じる|もどる|セーブ中)$(\r?\n|\r)?/gm, '') // Removing commands
    .replace(/^\s*$/gm, ''); // Remove empty lines

    if (s === '') return null;

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}