// ==UserScript==
// @name         [PCSG00648]  Tsuki ni Yorisou Otome no Sahou
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Navel& Dramatic Create
// ==/UserScript==
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200++'); // join 300ms

setHook({

    0x8002aefa: mainHandler.bind_(null, 2, 0, "dialogue"),

});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    //console.log("onEnter: " + hookname);
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString();

    return s;
}
