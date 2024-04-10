// ==UserScript==
// @name         [0100DA201E0DA000] Akuyaku Reijou wa Ringoku no Outaishi ni Dekiai Sareru
// @version      1.0.0
// @author       [GO123]
// @description  Yuzu
// *OperaHouse
// *
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/[\s]/g, '')
        ;
});
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x817b35c4 - 0x80004000]: mainHandler.bind_(null, 1, "Dialogue"), // Dialogue
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    //console.log('onEnter ' + hookname);

    const address = regs[index].value;

    /* processString */
    let s = address.readUtf8String();

    return s;
}
