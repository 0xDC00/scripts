// ==UserScript==
// @name         [NPJH50505] Fate/EXTRA CCC
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * 
// * 
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

setHook({
    0x8958490: trans.send(handler)
});

function handler(regs) {
    const address = regs[0].value; // a0

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    /** @type { String } */
    let s = address.readShiftJisString();

    // print rubi
    const rubis = s.matchAll(/(#RUBS(#[A-Z0-9]+)*)(.+?(?=#))(#[A-Z0-9]+)+(.+?(?=#))/g);
    for (const rubi of rubis) {
        console.log('rubi', rubi[3]);
        console.log('rube', rubi[5]);
    }
    // remove rubi
    s = s.replace(/#RUBS(#[A-Z0-9]+)*[^#]+/g, '');

    // hidden rubi #[男][ヤツ]#   => 男

    // replace user
    s = s.replace(/#FAMILY/g, '$FAMILY');
    s = s.replace(/#GIVE/g, '$GIVE');
    
    // fix str
    //s = s.replace(/①②③④⑤/g, 'SE.RA.PH');
    
    // remove control
    s = s.replace(/(#[A-Z0-9\-]+)+/g, '');

    // single line
    s = s.replace(/\n+/g, ' ');
    
    return s;
}
