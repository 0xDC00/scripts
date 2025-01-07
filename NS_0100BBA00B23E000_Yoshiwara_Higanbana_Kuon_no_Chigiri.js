// ==UserScript==
// @name         [0100BBA00B23E000] Yoshiwara Higanbana Kuon no Chigiri
// @version      1.0.2
// @author       kenzy
// @description  Yuzu, Ryujinx
// * MariaCrown
// * PROTOTYPE
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, "200+");

console.log("Issue: Even though the protagonist is namable, her name is always displayed as 凛 in the script.")

setHook({
    '1.0.2': {
        [0x800818f8 - 0x80004000]: mainHandler.bind_(null, 9, 0x2),   // text
        [0x8004deb4 - 0x80004000]: mainHandler.bind_(null, 0, 0),     // choices
        [0x8013b498 - 0x80004000]: mainHandler.bind_(null, 8, 0x2),   // dict1
        [0x8013b4cc - 0x80004000]: mainHandler.bind_(null, 8, 0x2),   // ditc2
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);
   // console.log("onEnter: " + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.add(offset).readUtf16String();
    s = s.replace(/(^`)|(#\w+\[(\d*\.?\d+)\])|(\$K\d+)|(\$C\[\d+\])/g, '') // remove controls
         .replace(/\$\[([^\$\/]*)\$\/[^\$]*\$]|([^\$\/]*)\$\/[^\$]*\$\]/g, '$1$2') // remove rubi
         .replaceAll('@', '') 
         .replaceAll('$2', '凛');
 
return s;
}

