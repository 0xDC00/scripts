// ==UserScript==
// @name         [SLPS25414] ToHeart2
// @version      0.1
// @author       logantgt
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({
    0x156EAC: trans.send(handler)
});

var stringBuffer = new Array("");
var output = "";

function handler(args) {
        // Read string
        let s = this.context.v0(asPsxPtr).readShiftJisString();

        // Assemble fragments
        if(s.endsWith("\\k") || s.endsWith("\\k\\n") || s.includes("\\p")) {
            output = "";
            stringBuffer.forEach((element) => {
                output = output + element;
            })
            output = output + s;
            output = output.split("\\")[0];
            stringBuffer = new Array("");
        }
        else {
            if(s.endsWith("\\n")) { s = s.split("\\n")[0]; }
            stringBuffer.push(s);
            return "";
        }

        // Process string
        output = output
        .replace(/(\\n)+/g, ' ')  
        .replace(/\\d$|^\@[a-z]+|#.*?#|\$/g, '')
        .replace(/\u3000+/gu, '')
        .replace(/@w|\\c/g, '');

        return output;
}