// ==UserScript==
// @name         [01005B9014BE0000] Shuuen no Virche -ErroR:salvation
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+'); // join 200ms
const directHandler = trans.send(handler);

setHook({
    '1.0.0': {
        //0x80C41B0: mainHandler, (just test arm pattern)
        0x801f594: mainHandler, // dialog
        0x801f668: directHandler, // center (immediate)
        //0x802b768: mainHandler, // name (wrong)
        0x803d540: mainHandler  // choice
    }
}[globalThis.gameVer ?? gameVer]);

function getOffsets(armAddress) {
    switch (armAddress) {
        case 0x801f594:
        case 0x801f668:
            return 0x1C;
        // case 0x802b768: return 0x40;
        default:
            return 0;
    }
}

function handler(regs) {
    const address = regs[0].value; // x0

    console.log('onEnter', ptr(this.context.pc));
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const offset = getOffsets(this.context.pc);
    let s = address.add(offset).readUtf8String();
    
    // print rubi
    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi', rubi[3]);
        console.log('rube', rubi[2]);
    }
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, '$2');
    // remove icon
    
    // remove controls
    s = s.replace(/#Color\[[\d]+\]/g, '');

    s = s.replace(/(　#n)+/g, '#n'); // \s?
    s = s.replace(/#n+/g, ' '); // single line

    return s;
}

