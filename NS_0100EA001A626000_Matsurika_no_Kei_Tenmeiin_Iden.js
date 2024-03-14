// ==UserScript==
// @name         [0100EA001A626000] Matsurika no Kei -kEi- Tenmeiin Iden
// @version      1.0.0
// @author       koukdw
// @description  Yuzu
// * Otomate
// * spec engine (Jakou no Lyla / Birushana Senki)
// ==/UserScript==

const gameVer = '1.0.0';
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+'); // join: separator=': ' (250+: +)

setHook({
    '1.0.0': {
        [0x8017ad54 - 0x80004000]: mainHandler, // text
        [0x80174d4c - 0x80004000]: mainHandler, // name
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    //console.log('onEnter');
    const address = regs[1].value; // name
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x60 }));
    /* processString */
    let s = address.readUtf32StringLE();

    if(s === "　　") return null;

    s = s.replace(/\n+/g, ' ');

    s = s.replaceAll('${FirstName}', 'ナーヤ');

    if (s.startsWith('#T')) {
        s = s.replace(/\#T2[^#]+/g, ''); // \#T2[^#]+ || \#T2[^\n]+ (\n=space)
        s = s.replace(/\#T\d/g, '');
    }

    return s;
}