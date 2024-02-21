// ==UserScript==
// @name         [0100D7800E9E0000] Trials of Mana
// @version      1.1.1
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.1.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, -200);

setHook({
    '1.1.1': {
        [0x800e8abc - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
*Some parts of the intro will be missing but the rest should be ok.
*Some UI elements will not be captured, try using an OCR for those parts.
`);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();
    
    s = s
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/^二十五字二.*(\r?\n|\r)?/gm, '') // Remove line if it starts with 二十五字二
    .replace(/^操作を割り当てる.*(\r?\n|\r)?/gm, '') // Remove line if it starts with 操作を割り当てる
    .replace(/^上記アイコンが出.*(\r?\n|\r)?/gm, '') // Remove line if it starts with 上記アイコンが出
    .replace(/[()~^,ö.!]/g, '') // Remove specified symbols

    if (s === previous) {
        return null;
    }
    previous = s;

    return s;
}