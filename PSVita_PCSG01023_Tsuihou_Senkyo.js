// ==UserScript==
// @name         [PCSG01023]  Tsuihou Senkyo
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Nippon Ichi Software & Regista
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replace(/<br>/g, '')
        .replace(/%CF11F/g, "")
        .replace(/%CFFFF/g, "")
        .replace(/%K%P/g, '')
        .replace(/%K%N/g, '')
        .replaceAll("\n", '')

        ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
    0x8002e176: mainHandler.bind_(null, 0, 0, "dialogue"),//dialogue+name
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString();


    return s;
}
