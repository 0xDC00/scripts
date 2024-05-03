// ==UserScript==
// @name         [0100C0000CEEA000] Yo-kai Watch 1
// @version      1.3.0
// @author       [Kalleo]
// @description  Yuzu
// * Level-5
// *
// ==/UserScript==
const gameVer = '1.3.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '400+');

setHook({
    '1.3.0': {
        "H669bdbdc4da92463": mainHandler.bind_(null, 1, "Text"),
    }
}, globalThis.gameVer = globalThis.gameVer ?? gameVer);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
        .replace(/\[([^\]]+)\/[^\]]+\]/g, '$1') // Remove furigana
        .replace(/\s+/g, ' ') // Replace any sequence of whitespace characters with a single space
        .replace(/\\n/g, '\n') // Replace '\n' with line break
        .replace(/<[^>]+>|\[[^\]]+\]/g, ''); // Remove anything within < > or [ ]

    if (s === previous) {
        return;
    }
    previous = s;

    if (s === '') return null;

    return s;
}
