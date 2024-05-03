// ==UserScript==
// @name         [010014D01216E000] Rune Factory 5
// @version      1.1.1
// @author       [Kalleo]
// @description  Yuzu
// * Marvelous, XSEED Games
// *
// ==/UserScript==
const gameVer = '1.1.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, 200);

setHook({
    '1.1.1': {
        "H8293950d558a3cac": mainHandler.bind_(null, 1, "Main Text"),
        "H9afedfb2d5101c93": mainHandler.bind_(null, 1, "Secondary Text"),
    }
}, globalThis.gameVer = globalThis.gameVer ?? gameVer);

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
        .replace(/^(?:そうび|はずす|もどる|もつ|おく|なげる|石|土|雑草|たべる)$(\r?\n|\r)?/gm, '') // Removing commands

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}
