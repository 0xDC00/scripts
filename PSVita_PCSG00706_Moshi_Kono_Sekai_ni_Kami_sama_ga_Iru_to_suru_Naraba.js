// ==UserScript==
// @name         [PCSG00706]  もし、この世界に神様がいるとするならば。 Moshi, Kono Sekai ni Kami-sama ga Iru to Suru Naraba.
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Rejet
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
    0x80c1f270: mainHandler.bind_(null, 0, 0, "dialogue"),//dialogue+ textmessage 

    //however when the game goes NVL it will extract the whole box instead of line by line 


});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    const len = address.add(0x8).readU32() * 2;
    let s = address.add(0xC).readUtf16String(len);


    return s;
}