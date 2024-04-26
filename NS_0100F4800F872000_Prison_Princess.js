// ==UserScript==
// @name         [0100F4800F872000] Prison Princess
// @version      1.0.0
// @author       [kinyarou]
// @description  Yuzu
// * PROTOTYPE
// * 
//
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x800eba00 - 0x80004000]: mainHandler
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
	return regs[2].value.add(0x14).readUtf16String();
}