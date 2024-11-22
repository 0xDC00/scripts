// ==UserScript==
// @name         [SLPM66302] CLANNAD
// @version      0.2
// @author       logantgt
// @description  PCSX2 x64
// * Interchannel/Prototype Legacy Engine
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({
    0x14AC38: trans.send(handler)
});

function handler(args) {
        // Read string
        let s = this.context.s4(asPsxPtr).readShiftJisString().split(");")[0];

        // Filter out name text
        if(s.split('】').length > 1) { s = s.split('】')[1] }

        // Process string, replace MC name variables
        s = s
            .replace(/(\\n)+/g, ' ')  
            .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
            .replace(/\u3000+/gu, '')
            .replace(/@w|\\c/g, '')
            .replace("＊Ａ", "岡崎")
            .replace("＊Ｂ", "朋也")
    
        return s;
}