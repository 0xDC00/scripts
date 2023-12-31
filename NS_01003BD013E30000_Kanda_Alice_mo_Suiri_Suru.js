// ==UserScript==
// @name         [01003BD013E30000] Kanda Alice mo Suiri Suru.
// @version      1.0.0
// @author       emilybrooks
// @description  Yuzu
// * El Dia
// *
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler);

setHook({
    '1.0.0': {
        [0x80041db0 - 0x80004000]: mainHandler,
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    let text = address.readShiftJisString();
    text = text.replace(/{|\/.*?}|\[.*?\]/g, '');
    return text;
}
