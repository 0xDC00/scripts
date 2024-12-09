// ==UserScript==
// @name         [SLPS25677] BLOOD+ One Night Kiss
// @version      0.1
// @author       Owlie
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({      
    0x267B58: trans.send(handler), // Information text
    0x268260: trans.send(handler), // NPC dialogue text
});

function handler(args) {    
        
        let s = this.context.a3(asPsxPtr).readShiftJisString();        
                
        return s;        
}