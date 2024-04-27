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
        [0x8180de40 - 0x80004000]: mainHandler, // text box
        [0x816b61c0 - 0x80004000]: mainHandler, // dictionary
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    const len = address.add(0x10).readU16() * 2;
    let text = address.add(0x14).readUtf16String(len);
    text = text.replace(/\[dic.*?text=/g, ''); // dictionary words
    text = text.replace(/\[|'.*?\]/g, ''); // ruby text
    text = text.replace(/\]/g, ''); // closing brace if no ruby text
    text = text.replace(/\s|　/g, ''); // remove whitespace
    return text;
}
