// ==UserScript==
// @name         [SLPM65914] NANA
// @version      0.1
// @author       Owlie
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

setHookEE({           
    0x15036C: trans.send(handler)
});

function handler(args) {
    let s = this.context.a3(asPsxPtr).readShiftJisString();

    // Remove ①ｎ from dialogue lines
    s = s.replace(/①ｎ/g, '');

    // Remove lines with unwanted patterns
    s = s
    .replace(/^(Ｖ＿.*|[\s－０-９0-9，．\-±]+)$/gm, '')  // Remove lines starting with Ｖ＿, or lines with only "－", full/half-width numbers and punctuation
    .replace(/^([±\s]+[０-９０-９，．\-]+|[０-９0-9，．\-]+)$/gm, '');  // Remove lines starting with ± and full-width numbers and punctuation

    return s.trim();
}
