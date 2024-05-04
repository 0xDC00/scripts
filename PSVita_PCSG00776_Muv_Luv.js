// ==UserScript==
// @name         [PCSG00776] Muv-Luv
// @version      1.00
// @author       [blacktide082]
// @description  Vita3k
// * 5pb
// ==/UserScript==

const { setHook } = require("./libVita3k.js");
const handler = trans.send(s => s || null, '100+');

setHook({
    0x80118f10: callback.bind_(null, 5, 0, "dialogue"),
    0x80126e7e: callback.bind_(null, 0, 0, "choices"),
});

function callback(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);
    const text = address.readShiftJisString()
        .replace('\u0002', '') // remove STX character
        .trim();
    handler(text);
}
