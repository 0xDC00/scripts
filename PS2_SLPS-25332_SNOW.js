// ==UserScript==
// @name         PS2_SLPS-25332_SNOW.js
// @version      0.0
// @author       logantgt
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");
const Encoding = require('./libHelperEncoding.js');
const enc = new Encoding(__dirname + '/charsets/tblNECInterChannelJP.txt');

setHookEE({
    0x10D7CC: trans.send(handler)
});

function handler(args) {
        /* processString */
        let s = "";
        if(new Uint8Array(this.context.a0(asPsxPtr).readByteArray(1))[0] == 0x2C) {
          s = this.context.a0(asPsxPtr).add(1).readCustomString(enc).split('($5200)')[0];
        }
        else {
          s = this.context.a0(asPsxPtr).readCustomString(enc).split('($5200)')[0];
        }
        
        s = s 
        .replace(/(\\n)+/g, ' ')  
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
        .replace(/\u3000+/gu, '')
        .replace(/@w|\\c/g, '')

        return s;        
}