// ==UserScript==
// @name         [01007AD01CB42000] Mistonia no Kibou -The Lost Delight-
// @version      1.0.0
// @author       [nanaa]
// @description  Yuzu
// Idea Factory Co., Ltd. & Otomate

// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');


setHook({
    '1.0.0': {
        [0x817ed548 - 0x80004000]: mainHandler.bind_(null, 0), //dialogues
        [0x817f183c - 0x80004000]: mainHandler.bind_(null, 1), //pop up dictionary 1
        //[0x82869dbc - 0x80004000]: mainHandler.bind_(null, 1), //dictionary menu (buggy)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index) {
    const address = regs[index].value;
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+/g, ' ');  // single line
    s = s.replace(/[~^$(,)R]/g, ' '); //remove symbols
    return s;
}
