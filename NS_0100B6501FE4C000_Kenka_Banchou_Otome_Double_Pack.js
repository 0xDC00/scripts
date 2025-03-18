// ==UserScript==
// @name         [0100B6501FE4C000] Kenka Banchou Otome Double Pack
// @version      1.1.0
// @author       kenzy
// @description  Yuzu, Ryujinx
// * RED
// * Spike Chunsoft
// ==/UserScript==
const gameVer = '1.1.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

console.log
(`
    * Set the game's TEXT SPEED to MAX for the script to display properly.
`)

setHook({
    '1.1.0': {
        [0x81801c7c - 0x80004000]: mainHandler.bind_(null, 0, 'text'), 
        [0x8161f640 - 0x80004000]: mainHandler.bind_(null, 0, "names"),            
        [0x817f8490 - 0x80004000]: mainHandler.bind_(null, 1, "choices"),        
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;

   // console.log("onEnter: " + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

   let s = address.add(0x14).readUtf16String();     
       s = s.replace(/[\r\n]+/g, '');

 
return s;
}

