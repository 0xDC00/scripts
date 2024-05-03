// ==UserScript==
// @name         [010027401A2A2000] Utakata no Uchronia
// @version      1.0.0
// @author       emilybrooks
// @description  Yuzu
// * LicoBiTs
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler);

setHook({
    '1.0.0': {
        [0x8180de40 - 0x80004000]: mainHandler.bind_(null, 0, "text"),
        [0x816b61c0 - 0x80004000]: mainHandler.bind_(null, 0, "dictionary"),
        [0x815fe594 - 0x80004000]: mainHandler.bind_(null, 0, "choices"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, name) {
    const address = regs[index].value;
    const len = address.add(0x10).readU16() * 2;
    let text = address.add(0x14).readUtf16String(len);
    text = text.replace(/\[dic.*?text=/g, ''); // dictionary words
    text = text.replace(/\[|'.*?\]/g, ''); // ruby text
    text = text.replace(/\]/g, ''); // closing brace if no ruby text
    text = text.replace(name === 'choices' ? /[^\S\n]|　/g : /\s|　/g, ''); // remove whitespace (leave line breaks for choices)
    return text;
}
