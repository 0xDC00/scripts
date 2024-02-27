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
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x83fab4bc - 0x80004000]: mainHandler.bind_(null, 0, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\[.*?\]/g, '') // Remove anything inside []
    .replace(/^(?:メニュー|システム|Ver.)$(\r?\n|\r)?/gm, '') // Removing commands
    .replace(/^\s*$/gm, ''); // Remove empty lines

    if (s === '') return null;

    if (s === previous) return;
    previous = s;

    return s;
}