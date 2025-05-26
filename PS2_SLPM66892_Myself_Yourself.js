// ==UserScript==
// @name         [SLPM-66892] Myself;Yourself
// @version      0.1
// @author       konan
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({
    0x1443e8: trans.send(mainHandler),
    0x13F1F8: trans.send(choicesHandler),
});

function mainHandler(args) {  
    let s = this.context.t0(asPsxPtr).add(0x15010).readShiftJisString(); // speaker
    s += this.context.t0(asPsxPtr).readShiftJisString();                 // line
 
    s = s.replace(/^(%n)+/, "");
    
    return s;        
}

function choicesHandler(args) {
    let t0 = this.context.t0(asPsxPtr);
    let offset = findStringStart(t0);
    
    let s = t0.add(offset).readShiftJisString();
    
    return s;
}

function findStringStart(last2BytesAddress) {
    let offset = 0;
    let address = last2BytesAddress;
    
    while (address.readU8() != 0) {
        address = address.add(-1);
        offset--;
    }
    offset++;
    
    return offset;
}
