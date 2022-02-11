// ==UserScript==
// @name         [NPJH50909] Sekai de Ichiban Dame na Koi
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * 
// * 
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler);

setHook({
    0x8814adc: mainHandler,
    0x8850b2c: mainHandler,
});

function handler(regs) {
    console.log('onEnter');

    const address = regs[0].value; // a0
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readShiftJisString();

    // controls
    s = s.replace(/(\%N)+/g, ' ') // single line
        .replace(/\%@\%\d+/, '') // scale %@%200
        ;

    // reformat name
    let name = s.match(/^[^「]+/);
    if (name !== null) {
        s = s.replace(/^[^「]+/, '');
        s = name + '\n' + s;
    }

    return s;
}