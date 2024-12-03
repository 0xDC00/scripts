// ==UserScript==
// @name         [SLPM66045] My Merry May with be
// @version      0.1
// @author       Owlie
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({
   
    0x1DB7DC: trans.send(handler),
    

});

function handler(args) {
        
        let s = this.context.a3(asPsxPtr).readShiftJisString();
        
        s = s

        .replace(/%\w+\d*\w*/g, '')
        .replace(/%N+/g, '')
        
        return s;        
}