// ==UserScript==
// @name         [0100A250191E8000] Money Parasite ~Usotsuki na Onna~
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * TAKUYO
// ==/UserScript==
const gameVer = '1.0.0';

globalThis.ARM = true;
const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x2169ac - 0x204000]: mainHandler.bind_(null, 0, "text"),
        [0x217030 - 0x204000]: mainHandler.bind_(null, 0, "choices"),                
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
   // console.log("onEnter: " + hookname);
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    
    let s = address.readShiftJisString();
    s = s.replace(/(\\n)+/g, ' ')  
         .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
         .replace(/\u3000+/gu, '')
         .replace(/@w|\\c/g, '');
    
    if (hookname === "choices") {
    s = s.replace(/, ?\w+/g, '');
    }
                
return s;
}
