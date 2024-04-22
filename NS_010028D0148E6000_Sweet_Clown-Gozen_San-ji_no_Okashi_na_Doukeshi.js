// ==UserScript==
// @name         [010028D0148E6000] Sweet Clown ~Gozen San-ji no Okashi na Doukeshi~
// @version      1.0.0, 1.0.2
// @author       [Enfys]
// @description  Yuzu
// * TAKUYO

//*
// ==/UserScript==
const gameVer = '1.0.2';
globalThis.ARM = true;

// Game not displaying correctly on Yuzu
// Issue is unrelated to this script, text should still be correct
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+');

// I don't know if those scripts have been done before the tracer fix so if there's a problem multiply the register by 2 
// Old tracer assumed the register were 64bit which was wrong
setHook({
    '1.0.2': {
        // 0x21a234:  mainHandler.bind_(null, 0, "all text"), // messy, needs lots of regex
        [0x20dbfc - 0x204000]: mainHandler.bind_(null, 0, 0x28, "dialog"), // need to .add(0x28)s
        [0x214978 - 0x204000]: mainHandler.bind_(null, 3, 0xC, "choices"), // many calls, choice only, need to add s.add(0xC)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset, hookname) {
    const reg = regs[index];
    const address = reg.value;
    
    if (reg.vm > 1000000000) return null; // janky code to filter out junk calls

    let s = address.add(offset).readShiftJisString();
    s = s
        .replace(/{|\/.*?}|\[.*?\]/g, '')
        .replace(/(\\c|\\n)+/g, ' ')
        .replace(/,.*$/,' ')
    ;

    return s;
}
