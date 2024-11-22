// ==UserScript==
// @name         [SLPS25332] SNOW
// @version      0.2
// @author       logantgt
// @description  PCSX2 x64
// * Interchannel/Prototype Legacy Engine
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");
const Encoding = require('./libHelperEncoding.js');
const enc = new Encoding(__dirname + '/charsets/tblNECInterChannelJP.txt');

setHookEE({
    0x10D7CC: trans.send(handler)
});

function handler(args) {
        let s = "";

        // Read string at right position
        if(new Uint8Array(this.context.a0(asPsxPtr).readByteArray(1))[0] == 0x2C) {
          s = this.context.a0(asPsxPtr).add(1).readCustomString(enc);
        }
        else {
          s = this.context.a0(asPsxPtr).readCustomString(enc);
        }
        
        // Process string, replace MC name variables
        s = s
        .split('($')[0]
        .replace(/(\\n)+/g, ' ')  
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
        .replace(/\u3000+/gu, '')
        .replace(/@w|\\c/g, '')
        .replace("＊Ａ", "出雲")
        .replace("＊Ｂ", "彼方")

        return s;        
}