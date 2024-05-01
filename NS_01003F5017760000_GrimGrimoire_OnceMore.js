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

setHook({
    '1.0.0': {
        [0x80020bd4 - 0x80004000]: mainHandler.bind_(null, 0, 0, "Main"),
        [0x800375a0 - 0x80004000]: mainHandler.bind_(null, 2, 0, "Tutorial"),
        [0x800781dc - 0x80004000]: mainHandler.bind_(null, 0, 0, "Chapter"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, offset, hookname) {
	return regs[index].value.add(offset).readUtf8String();
}
