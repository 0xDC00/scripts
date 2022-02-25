// ==UserScript==
// @name         [0100A3A00CC7E000] CLANNAD
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * PROTOTYPE
// * 
//
// Warnning: Dual language
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        //0x806a29c: mainHandler, // x1 dialouge+name, choice (KnowIssue: miss delay)
        0x8072d00: mainHandler, // x1 dialouge+name, choice (delay break: fix miss; KnowIssue: firstName=＊Ｂ, lastName=＊Ａ)
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value;
    console.log('onEnter');

    /* processString */
    let s = address.readUtf16String();

    //// format name (0x806a29c only): $tSunohara@$S081Phhhhht
    //s = s.replace(/^\$t([^\@]+)./g, '$1: ');
    //// format name (0x8072d00 only): `＊Ｂ@C'mon, let's go.
    s = s.replace(/^\`([^\@]+)./g, '$1: ').replaceAll('＊Ａ', 'Okazaki').replaceAll('＊Ｂ', 'Tomoya');

    // remove controls, ig: $K37kotatsu$K0, $S000,0
    s = s.replace(/\$[A-Z]\d*(,\d*)*/g, '');

    const patt = /\$\[([^$]+)..([^$]+)../g;

    // print rubi
    const rubis = s.matchAll(patt);
    for (const rubi of rubis) {
        console.log('rubi', rubi[2]);
        console.log('rube', rubi[1]);
    }

    // remove rubi
    s = s.replace(patt, '$1'); // $[竜田$/たつた$], $[竜太$/りゅうた$]

    return s;
}