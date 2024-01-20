// ==UserScript==
// @name         [0100C1E0102B8000] Shinobi, Koi Utsutsu
// @version      1.0.0
// @author       [Hiyo]
// @description  Yuzu
// * Idea Factory Co., Ltd. / Otomate

// ==/UserScript==

const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
	[0x8002aca0 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
	[0x8002aea4 - 0x80004000]: mainHandler.bind_(null, 0, "dialogue1"), 
	[0x8001ca90 - 0x80004000]: mainHandler.bind_(null, 2, "dialogue2"), 
	[0x80049dbc - 0x80004000]: mainHandler.bind_(null, 1, "choice"),
    }
	
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);
	
function handler(regs, index, hookname) {
    const address = regs[index].value;

    let s = address.readUtf8String()
	.replace('\n', ' ')
	.replace('#n', ' ')	
	.replace(/#Color\[[\d]+\]/g, '');
	;

    return s;
}