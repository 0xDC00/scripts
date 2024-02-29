// ==UserScript==
// @name         [0100AFA01750C000] Shinigami to Shoujo
// @version      1.0.0, 1.0.2
// @author       [GO123]
// @description  Yuzu
// * TAKUYO
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.2': {
        [0x21cbb0 - 0x80004000]: mainHandler.bind_(null, 2, "text"),//Name+text


    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];


    if (reg.vm > 0x4000000000) return null; // filter janky code


    console.log('onEnter: ' + hookname);
    const address = reg.value;
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    /* processString */
    let s = address.readShiftJisString()
        .replaceAll(/[\s]/g, '')
        .replaceAll(/\\n/g, '')
        .replaceAll(/\\d/g, '')
        .replaceAll(/@[a-z]/g, "")
        .replaceAll("$","")
        ;

    return s;
}
