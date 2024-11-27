// ==UserScript==
// @name         [ULJM05447] Will O' Wisp Portable (v1.02)
// @version      1.02
// @author       kenzy
// @description  PPSSPP x64
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler);

setHook({
      0x885dd04: mainHandler.bind_(null, 0) // text
});

function handler(regs, index, offset) {
    const address = regs[index].value;
    // console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString();
    s = s.replace(/(#n)+/g, ' ')
         .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')

return s;
}
