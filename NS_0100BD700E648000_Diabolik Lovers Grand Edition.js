// ==UserScript==
// @name         [0100BD700E648000] Diabolik Lovers Grand Edition
// @version      1.0.0
// @author       [Hiyo]
// @description  Yuzu
// * Idea Factory Co., Ltd. / Otomate & Rejet

// ==/UserScript==

const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
		
	[0x80041080 - 0x80004000]: mainHandler.bind_(null, 1, "name"),
	[0x8002886c - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"), 
	[0x80041040 - 0x80004000]: mainHandler.bind_(null, 2, "choice1"),
	}
	
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);
	
function handler(regs, index, hookname) {
    const address = regs[index].value;
	
    let s = address.readUtf8String()
	.replace('*', ' ')	
	.replace('ゞ', '！？')	
	;

    return s;
}