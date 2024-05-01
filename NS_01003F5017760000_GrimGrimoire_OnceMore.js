// ==UserScript==
// @name         [01003F5017760000] GrimGrimoire OnceMore
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
const tutorialHandler = trans.send(handler2, '200+');

setHook({
    '1.0.0': {
        [0x80020bd4 - 0x80004000]: mainHandler,
        [0x800375a0 - 0x80004000]: tutorialHandler,
        [0x800781dc - 0x80004000]: mainHandler 
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
	return regs[0].value.readUtf8String();
}
function handler2(regs) {
	return regs[2].value.readUtf8String();
}