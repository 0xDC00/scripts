// ==UserScript==
// @name         [01007B601C608000] Crayon Shin-chan Shiro of Coal Town
// @version      1.0.1
// @author       [Kalleo]
// @description  Yuzu
// * Neos Corporation
// *
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');

setHook({
    '1.0.1': {
        [0x83fab4bc - 0x80004000]: swapHandler,
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";

function handler(regs, index, hookname) {
    // console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\[.*?\]/g, '') // Remove anything inside []
    .replace(/^(?:メニュー|システム|Ver.)$(\r?\n|\r)?/gm, '') // Removing commands
    .replace(/^\s*$/gm, ''); // Remove empty lines

    return s;
}

let text = [];
let timerSwap;
function swapHandler(regs) {
    const s = handler.call(this, regs, 0, "all text");

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
