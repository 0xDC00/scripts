// ==UserScript==
// @name         [NPJH50909] Kamigami no Asobi InFinite
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * 
// * 
// KnownIssue: missed choice (2nd+)
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

setHook({
    0x088630f8: trans.send(handler, 400), // text, choice (debounce trailing 400ms), TODO: better hook
    0x0887813c: trans.send(handler2)      // Question YN
});

function handler(regs) {
    console.log('onEnter');

    const a0 = regs[0];
    a0.vm = 0x08975110; // just calc, no need a0.save();
    const adr = a0.value.add(0x20);               // [0x08975110+0x20]
    const len = a0.value.add(0x14).readU32() * 2; // [0x08975110+0x14] numChar -> numByte

    //console.log(hexdump(adr, { header: false, ansi: false, length: 0x50 }));

    return processString(adr, len);
}

function handler2(regs) {
    console.log('onEnter');

    const adr = regs[3].value.add(4); // a3
    //console.log(hexdump(adr, { header: false, ansi: false, length: 0x50 }));

   return processString(adr);
}

function processString(adr, len = -1) {
    if (len === 0) return null;

    let s = adr.readShiftJisString(len)
        .replace(/(\u0000|\n|㌻)+/g, ' ');
    return s;
}