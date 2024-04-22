// ==UserScript==
// @name         [0100AFA01750C000] Shinigami to Shoujo
// @version      1.0.0, 1.0.2
// @author       koukdw
// @description  Yuzu
// * TAKUYO
// *
// ==/UserScript==
const gameVer = '1.0.2';


globalThis.ARM = true;
const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');


console.log("To solve text display bug, use opengl API and set Grahpics -> Advanced -> Accuracy level to Extreme.")

setHook({
    '1.0.2': {
        [0x21cb08 - 0x204000]: mainHandler.bind_(null, 1, "text"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const reg = regs[index];

    //console.log('onEnter: ' + hookname);
    const address = reg.value;
    /* processString */
    const s = address.readShiftJisString()
        .replace(/(\\n)+/g, ' ')
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '') // #.*?# <=> #[^#]+.
        ;

    return s;
}
