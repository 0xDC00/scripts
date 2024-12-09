// ==UserScript==
// @name         [SLPS25547] Ichigo Marshmallow
// @version      0.1
// @author       Owlie
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({       
    0x1439F4: trans.send(handler)   
});

function handler(args) {
     
    let s = this.context.s1(asPsxPtr).readShiftJisString();  
    
    s = s
    .replace(/^\[.*$/gm, '')                      
    .replace(/\_0C|\_1_5C|\_1C/gm, '')             
    .replace(/^([a-zA-Z]+)|([a-zA-Z]+)$/gm, '')   
      
    return s;     
}
