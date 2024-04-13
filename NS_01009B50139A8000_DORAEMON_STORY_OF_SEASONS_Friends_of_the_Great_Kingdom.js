// ==UserScript==
// @name         [01009B50139A8000] DORAEMON STORY OF SEASONS: Friends of the Great Kingdom
// @version      1.1.1
// @author       [Kalleo]
// @description  Yuzu
// * Marvelous, Bandai Namco
// *
// ==/UserScript==
const gameVer = '1.1.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200');
const mainHandler2 = trans.send(handler, '600+');

setHook({
    '1.1.1': {
        [0x839558e4 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
        [0x8202a9b0 - 0x80004000]: mainHandler2.bind_(null, 0, "Tutorial"),
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
    .replace(/\b\d{2}:\d{2}\b/g, '') // Remove Hours
    .replace(/^(?:スキップ|むしる|取り出す|話す|選ぶ|ならびかえ|閉じる|やめる|undefined|決定|ボロのクワ|拾う)$(\r?\n|\r)?/gm, '') // Removing commands
    .replace(/^\s*$/gm, ''); // Remove empty lines

    if (s === '') return null;

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}