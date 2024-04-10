// ==UserScript==
// @name         [010021300F69E000] Zettai Kaikyu Gakuen
// @version      1.0.0
// @author       [GO123]
// @description  Yuzu
// * PROTOTYPE
// * 
//
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');


setHook({
    '1.0.0': {
        [0x80067b5c - 0x80004000]: mainHandler.bind_(null, 1, "text1"),// name+ dialogue main(ADV)+choices
        [0x80067cd4 - 0x80004000]: mainHandler.bind_(null, 1, "text2"),//dialogueNVL
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);
let previous = "";
function handler(regs, index, hookname) {
    const reg = regs[index];
    // console.log('onEnter: ' + hookname);
    const address = reg.value;
    //  console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    /* processString */
    let s = address.readUtf16String()
        .replaceAll(/\$[a-z]/g, "")
        .replaceAll("@", "")
        ;
    if (s === previous) {
        return null;
    }
    previous = s;
    return s;

}
