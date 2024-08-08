// ==UserScript==
// @name         [01007F000EB36000] Doukoku Soshite
// @version      1.0.0
// @author       GO123
// @description  Ryujinx
// * Sakata SAS & Studio Line & El Dia
// * Data East Corporation & El Dia & Red Flagship
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++'); // join 200ms

setHook({
    '1.0.0': {
		
  [0x8008171c - 0x80004000]: mainHandler.bind_(null, 0,0x0,"dialouge"), 
       
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset, hookname) {
    console.log('onEnter: ' + hookname);

    const address = regs[index].value;
   // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
     let s = address.add(offset).readShiftJisString();
 
    return s;
}

