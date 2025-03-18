// ==UserScript==
// @name         [010048101D49E000] Re;quartz Raid (Re;quartz零度)
// @version      1.0.1
// @author       kenzy
// @description  Ryujinx
// * B-cluster
// * PROTOTYPE
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, "200+");

setHook({
    '1.0.1': {
        [0x800ef69c - 0x80004000]: mainHandler.bind_(null, 1, 'text'),         
        [0x8011aea4 - 0x80004000]: mainHandler.bind_(null, 9, "choices"), 
    }

}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;

   // console.log("onEnter: " + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readUtf16String();
        s = s.replace(/\$\[([^\$\/]*)\$\/[^\$]*\$]|([^\$\/]*)\$\/[^\$]*\$\]/g, '$1$2'); // remove rubi
    
    if (s.startsWith('@')) {
            s = s.replaceAll('@', '');
    }             

    if (hookname === "choices") {
        s = s.split('$d').join('\n');
    }
 
return s;
}

