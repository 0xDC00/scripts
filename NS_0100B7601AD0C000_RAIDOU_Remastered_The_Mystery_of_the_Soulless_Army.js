// ==UserScript==
// @name         [0100B7601AD0C000] RAIDOU Remastered: The Mystery of the Soulless Army
// @version      1.00a
// @author       [Kalleo]
// @description  Yuzu/Ryujinx
// * Atlus
// *
// ==/UserScript==
const gameVer = '1.00a';

const { setHook } = require('./libYuzu.js');

setHook({
    '1.00a': {
        [0x81c3294c - 0x80004000]: swapHandler,
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";

function handler(regs, index, hookname) {
    // console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s.replace(/<[^>]*>/g, '');

    return s;
}

let text = [];
let timerSwap;
function swapHandler(regs) {
    const s = handler.call(this, regs, 0, "text");

    if (s === '') return null;
    if (s === previous) return;
    previous = s;

    text.push(s); // Changed from unshift to push

    clearTimeout(timerSwap);
    timerSwap = setTimeout(() => {
        const lastElement = text.pop(); // Remove last element
        text.unshift(lastElement); // Put it at the front
        const joinedText = text.join('\r\n'); // Join modified text array
        trans.send(joinedText);
        text = [];
    }, 300);
}