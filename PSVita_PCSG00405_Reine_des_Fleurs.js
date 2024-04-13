// ==UserScript==
// @name         [PCSG00405]  Reine des Fleurs
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Design Factory Co., Ltd. & Otomate &Idea Factory Co., Ltd.
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/[\s]/g, '')
        ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({

    0x8001bff2: mainHandler.bind_(null, 0, 0, "dialogue"),


});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    //console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString()

    return s;
}
