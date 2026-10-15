// ==UserScript==
// @name         [SLPS25390] Clover Heart's ~Looking for Happiness~
// @version      0.1
// @author       UGUU (based on [SLPS25332] SNOW script by logantgt)
// @description  PCSX2 x64
// * Interchannel/Prototype Legacy Engine
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");
const Encoding = require('./libHelperEncoding.js');
const enc = new Encoding(__dirname + '/charsets/tblNECInterChannelCloverHeartsJP.txt');

setHookEE({
    0x10bf8c: trans.send(handler)
});

function handler(args) {
        let s = "";
		const buf = this.context.a0(asPsxPtr);

        // Read string at right position
        if(new Uint8Array(buf.readByteArray(1))[0] == 0x2C) {
          s = buf.add(1).readCustomString(enc);
        }
        else {
          s = buf.readCustomString(enc);
        }
        
        // Filter out null and newlines
        s = s
		.split('($')[0]
		.replace(/\^+/g, ' ')

        return s;        
}