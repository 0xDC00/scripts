// ==UserScript==
// @name         [010037400DAAE000] Brothers Conflict: Precious Baby
// @version      1.0.0
// @author       [Hiyo]
// @description  Yuzu
// * Idea Factory Co., Ltd. / Otomate

// ==/UserScript==

const gameVer = '1.0.0';
const decoder = new TextDecoder('utf-16');
const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.0': {
		// Passion Pink & Brilliant Blue
		[0x8016aecc - 0x80004000]: mainHandler.bind_(null, 0, "name"),
        [0x80126b9c - 0x80004000]: mainHandler.bind_(null, 0, "dialogue"), 
		[0x80129160 - 0x80004000]: mainHandler.bind_(null, 2, "choice"),
    }
	
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);
	
function handler(regs, index, hookname) {
    const reg = regs[index];
    const address = reg.value;

    /* processString */
    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');
    return s;
}