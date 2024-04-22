// ==UserScript==
// @name         [0100B5500CA0C000] Hanayaka Nari, Waga Ichizoku Gentou Nostalgie
// @version      1.0.0
// @author       [DC]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * 
// ==/UserScript==
const gameVer = '1.0.0';

globalThis.ARM = true;
const { setHook } = require('./libYuzu.js');
const decoder = new TextDecoder('utf-8');

const mainHandler = trans.send(handler, '250+');

setHook({
    '1.0.0': {
        // 
        // SIG: 
        //0x27ca10: mainHandler, // x3 (double trigged), name+text, onscreen 
        [0x27ca10 - 0x204000]: mainHandler, // x3 (double trigged), name+text, onscreen 
        //0x77ca14
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    console.log('onEnter');

    let address = regs[6].value;
    //console.log(hexdump(regs[3].value.sub(0x10), { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.sub(2).readU16();
    //let s = len == 0 ? '' : address.readUtf8String(); // buggy (native, not support \0), TODO: new|replace engine
    let s = len == 0 ? '' : decoder.decode(new Uint8Array(ArrayBuffer.wrap(address, len))); // iconv lite engine

    if (s !== '') {
        s = s.replace(/\u0000+$/g, ''); // random (wrong len)
        s = s.replaceAll('\\', ' '); // single line
        s = s.replaceAll('$', ''); // colour
        // %　&
        //s = s.replaceAll('%', 'NAME1');
        //s = s.replaceAll('&', 'NAME2');
    } else return null;

    return s;
}