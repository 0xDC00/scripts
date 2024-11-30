// ==UserScript==
// @name         [SLPM65732] Akai Ito
// @version      0.1
// @author       logantgt
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({
    0x136800: trans.send(handler)
});

function handler(args) {
        // return if not dialogue buffer
        if(this.context.t0(Uint32Array)[0] != 0x49F8B0) return;

        let s = this.context.t0(asPsxPtr).readShiftJisString();
        
        s = s
        .replaceAll('#cr0', '')
        .replace(/(\\n)+/g, ' ')  
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
        .replace(/\u3000+/gu, '')
        .replace(/@w|\\c/g, '')

        return s;        
}