// ==UserScript==
// @name         [ULJS00403] Shinigami to Shoujo
// @version      0.1
// @author       [DC]
// @description  PPSSPP x64
// * TAKUYO
// * TAKUYO
// *
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler, '250+');

/*
0x883b0bc: mainHandler.bind_(null, 2), // a2 - choices (un-formated)
0x883cf04: mainHandler.bind_(null, 3), // a3 - choices + nameX2
0x883bf34: mainHandler.bind_(null, 1), // a1 - choices + dialogue + nameX2 <----
0x8836984: mainHandler.bind_(null, 1), // a1 - dialogue
0x883cecc: mainHandler.bind_(null, 3), // a3 - dialogue
*/
setHook({
    0x883bf34: mainHandler
});

function handler(regs) {
    console.log('onEnter');
    const address = regs[1].value;

    /* processString */
    // @w \nけど……#STAND\TOOY01A_N.bmp 3#微妙だっ $お姫様$』 \d
    const s = address.readShiftJisString()
        .replace(/(\\n)+/g, ' ')
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '') // #.*?# <=> #[^#]+.
        ;

    return s;
}