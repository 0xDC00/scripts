// ==UserScript==
// @name         PS2_SLPM-66302_Clannad.js
// @version      0.0
// @author       logantgt
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE } = require("./libPCSX2.js");
const { asPsxPtr } = require("./libPCSX2.js");

setHookEE({
    0x14AC38: trans.send(handler)
});

function handler(args) {
        /* processString */
        let s = this.context.s4(asPsxPtr).readShiftJisString().split(");")[0];
        s = s
            .replace(/(\\n)+/g, ' ')  
            .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
            .replace(/\u3000+/gu, '')
            .replace(/@w|\\c/g, '');
    
        return s;
}