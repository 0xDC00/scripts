// ==UserScript==
// @name         [ULJM6064] Armen Noir Portable
// @version      1.0
// @author       kenzy
// @description  PPSSPP x64
// * Design Factory Co., Ltd. & Otomate
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler);

setHook({
      0x883b6a8: mainHandler.bind_(null, 0), // text
});

function handler(regs, index, offset) {
    const address = regs[index].value;
    // console.log('onEnter');
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    
    let s = address.readShiftJisString();
    s = s.replace(/(#n)+/g, ' ')
         .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')

return s;
}
