// ==UserScript==
// @name         [01002DA013484000] The Legend of Zelda: Skyward Sword HD
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Nintendo
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');

setHook({
    '1.0.1': {
        [0x80dc36dc - 0x80004000]: swapHandler,
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    // console.log('onEnter: ' + hookname);
    const address = regs[index].value;

    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s.replace(/^\s*$/gm, ''); // Remove empty lines
    return s;
}

let text = [];
let timerSwap;
function swapHandler(regs) {
    const s = handler.call(this, regs, 3, "Text");
    text.unshift(s);

    clearTimeout(timerSwap);
    timerSwap = setTimeout(() => {
        const s = [...text].join('\r\n');
        trans.send(s);
        text = [];
    }, 300);
}