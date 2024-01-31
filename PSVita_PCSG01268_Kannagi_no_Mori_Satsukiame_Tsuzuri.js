// ==UserScript==
// @name         [PCSG01268]  神凪ノ杜 Kannagi no Mori Satsukiame Tsuzuri
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Matatabi
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replace(/<br>/g, '')

        ;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
    0x828bb50c: mainHandler.bind_(null, 0, 0, "dialogue"),//dialogue
    0x828ba9b6: mainHandler.bind_(null, 0, 0, "name"),//name
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const len = address.add(0x8).readU32() * 2;
    let s = address.add(0xC).readUtf16String(len);


    return s;
}
