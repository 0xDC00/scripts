// ==UserScript==
// @name         [0100DE200C0DA000] Yunohana Spring! ~Mellow Times~
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
	[0x80028178 - 0x80004000]: mainHandler.bind_(null, 0, "name"),
	[0x8001b9d8 - 0x80004000]: mainHandler.bind_(null, 2, "dialogue1"), 
	[0x8001b9b0 - 0x80004000]: mainHandler.bind_(null, 2, "dialogue2"),
	[0x8004b940 - 0x80004000]: mainHandler.bind_(null, 2, "dialogue3"),
	[0x8004a8d0 - 0x80004000]: mainHandler.bind_(null, 1, "choice"),
    }
	
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);
	
function handler(regs, index, hookname) {
    const address = regs[index].value;

    let s = address.readUtf8String()
	.replace('\n', ' ')
	.replace('#n', ' ')	
	;

    return s;
}