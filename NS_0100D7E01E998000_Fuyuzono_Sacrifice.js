// ==UserScript==
// @name         [0100D7E01E998000] Fuyuzono Sacrifice
// @version      1.0.0
// @author       emilybrooks
// @description  Sudachi, Ryujinx 1.1.1403
// * Design Factory Co., Ltd. & Otomate
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler);

setHook({
    '1.0.0': {
        [0x816c9e24 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
        [0x818c90d4 - 0x80004000]: mainHandler.bind_(null, 0, "dictionary"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, name) {
    const address = regs[index].value;
    const len = address.add(0x10).readU16() * 2;
    let text = address.add(0x14).readUtf16String(len);
    text = text.replace(/\s+/g, ''); // remove whitespace
    text = text.replace(/\$+/g, ''); // remove dictionary word markers
    return text;
}
