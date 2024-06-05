// ==UserScript==
// @name         [0100A62019078000] Temirana Koku no Tsuiteru Hime to Tsuitenai Kishidan
// @version      1.0.1
// @author       GO123
// @description  Ryujinx
//*	Ichi Column
//* Idea Factory Co., Ltd. & Otomate
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.1': {
        [0x82457970 - 0x80004000]: mainHandler.bind_(null, 0, "Dialogue text"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {

    const address = regs[index].value;
    //	console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.add(0x14).readUtf16String()
        .replaceAll(/[\s]/g, '')
        .replaceAll("$$R", '')
        .replaceAll("%", '')


    return s;
}