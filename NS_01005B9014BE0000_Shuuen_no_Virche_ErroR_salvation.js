// ==UserScript==
// @name         [01005B9014BE0000] Shuuen no Virche -ErroR:salvation
// @version      1.0.0
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
        //[0x800C41B0 - 0x80004000]: mainHandler.bind_(null, 0), (just test arm pattern)
        [0x8001f594 - 0x80004000]: mainHandler.bind_(null, 0x1C), // dialog
        [0x8001f668 - 0x80004000]: directHandler.bind_(null, 0x1C), // center (immediate)
        //[0x8002b768 - 0x80004000]: mainHandler.bind_(null, 0), // name (wrong)
        [0x8003d540 - 0x80004000]: mainHandler.bind_(null, 0) // choice
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, offset) {
    const address = regs[0].value; // x0

    console.log('onEnter ' + ptr(this.context.pc));
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.add(offset).readUtf8String();

    // print rubi
    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi: ' + rubi[3]);
        console.log('rube: ' + rubi[2]);
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
