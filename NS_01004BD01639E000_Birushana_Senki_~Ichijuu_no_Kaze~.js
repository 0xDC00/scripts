// ==UserScript==
// @name         [01004BD01639E000] Birushana Senki ~Ichijuu no Kaze~
// @version      1.0.0
// @author       [DC]
// @description  
// * Idea Factory
// * UTF32 like Jakou no Lyla ~Trap of MUSK~
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+');
const leaveHandler = trans.send(onLeave1, '200+');

var regs = null; // onEnter backup
setHook({
    '1.0.0': {
        [0x8004cfb8 - 0x80004000]: r => regs = r, // (unformated) onEnter x1: NAME+TEXT+TEXTONLY (formatString; trigged N time) -> ret x8 (usercall); sig=U"${FirstName}"
        [0x8004d73c - 0x80004000]: leaveHandler.bind_(null, 8, "name"), // (formated) onLeave 0x8004cfb8 19: name
        [0x8004d89c - 0x80004000]: leaveHandler.bind_(null, 8, "text"), // (formated) onLeave 0x8004cfb8 19: text
        [0x8004dB6c - 0x80004000]: leaveHandler.bind_(null, 8, "tex1"), // (formated) onLeave 0x8004cfb8 23: text (no name)
        //[0x8003ddd8 - 0x80004000]: mainHandler.bind_(null, 2), // (formated) NAME\nLINE\nLINE  | LINE\nLINE (no name)
        //
        [0x8017bc10 - 0x80004000]: mainHandler.bind_(null, 0, "choice"), // UNTESTED, sig=U"<C Function" or U"SltAdd"
        //[0x8006300c - 0x80004000]: mainHandler.bind_(null, 1, "choice"), // better?
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function onLeave1(_, index, note) {
    const retVal = regs[index];
    console.warn("onLeave: " + note);

    let s = readStdWString(retVal).replace(/\n+/g, ' ');
    if (s.startsWith('#T')) {
        s = s.replace(/\#T2[^#]+/g, ''); // \#T2[^#]+ || \#T2[^\n]+ (\n=space)
        s = s.replace(/\#T\d/g, '');
    }

    return s;
}

function handler(regs, index, note) {
    const address = regs[index].value;
    console.warn('onEnter ' + note);
    /* processString */
    let s = address.readUtf32StringLE().replace(/\n+/g, ' '); // Single line
    return s;
}

function readStdWString(wstr) {
    const reg = wstr;
    const address = reg.value;

    //console.warn(hexdump(address));

    const isTiny = (address.readU8() & 1) === 0;
    if (isTiny === true) {
        const szChar = 4; // wchar_t 4 bytes on linux
        return address.add(szChar).readUtf32StringLE();
    }

    //const _vm = retVal.vm; // backup
    reg.vm = address.add(8 * 2).readU64(); // set new vm
    const p = reg.value; // calc
    //retVal.vm = _vm; // restore

    return p.readUtf32StringLE();
}