// ==UserScript==
// @name         [PCSG00903] New Game! The Challenge Stage!
// @version      0.1
// @author       [DC]
// @description  Vita3k
// * MAGES. GAME
// *
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

setHook({
    // 0x0022b738(2) 0x0022b74c(0)
    0x0022b74c: trans.send(handler.bind_(null, 0), '200+') // dialouge + choice + ... => join \n
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter', this.context.pc);
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    
    /* processString */
    const len = address.add(0x14).readU32();
    //console.log(ArrayBuffer.wrap(address.add(0x1C), len));

    let s = address.add(0x1C).readUtf8String(len);

    // filters
    s = s.replace(/\\n/g, ' '); // single line

    return s;
}
