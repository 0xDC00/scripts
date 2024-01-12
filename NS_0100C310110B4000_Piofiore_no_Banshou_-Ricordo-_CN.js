// ==UserScript==
// @name         [0100C310110B4000] Piofiore no Banshou -Ricordo-
// @version      1.0.0
// @author       [DC]
// @description  
// * Game Source Entertainment | Idea Factory
// * Otome
//
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(s => s, '300+');
const choices = new Set();
var timerChoice;

setHook({
    '1.0.0': {
        [0x80015fa0 - 0x80004000]: handlerMsg, // after advTalkMsgText
        [0x80050d50 - 0x80004000]: handlerName, // after&before advTalkName (late)
        [0x8002F430 - 0x80004000]: handlerPrompt,
        [0x8002F4F0 - 0x80004000]: handlerPrompt,
        [0x8002F540 - 0x80004000]: handlerPrompt,
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handlerName(regs) {
    const s = handler.call(this, regs, 2, "name");
    mainHandler(s);
}

function handlerMsg(regs) {
    const s = handler.call(this, regs, 0, "text");
    setTimeout(mainHandler, 100, s);
}

function handlerPrompt(regs) {
    const s = handler.call(this, regs, 0, "choice");
    choices.add(s);

    clearTimeout(timerChoice);
    timerChoice = setTimeout(() => {
        const s = [...choices].join('\r\n');
        trans.send(s);
        choices.clear();
    }, 300);
}

function handler(regs, index, desc) {
    console.warn('onEnter ' + desc);

    const address = regs[index].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readCString()

    // print rubi
    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log('rubi: ' + rubi[3]);
        console.log('rube: ' + rubi[2]);
    }
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, '$2');
    // remove icon

    // remove controls
    s = s.replace(/#Color\[[\d]+\]/g, '');

    s = s.replace(/(　#n)+/g, '#n'); // \s?
    s = s.replace(/#n+/g, ' '); // single line

    return s;
}