// ==UserScript==
// @name         [ULJM06302-3] Seishun Hajimemashita!
// @version      1.0
// @author       kenzy
// @description  PPSSPP x64
// * honeybee
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler);

setHook({
    0x880a744: mainHandler.bind_(null, 0), // text
});

function handler(regs, index, offset) {
    const address = regs[index].value;
    // console.log('onEnter');
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
        
    let s = address.readShiftJisString();
    s = s.replace(/\n/g, ''); 

return s;
}
