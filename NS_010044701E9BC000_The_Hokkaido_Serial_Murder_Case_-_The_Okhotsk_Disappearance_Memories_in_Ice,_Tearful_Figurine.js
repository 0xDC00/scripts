// ==UserScript==
// @name         [010044701E9BC000] オホーツクに消ゆ ～追憶の流氷・涙のニポポ人形～
// @version      1.0.0
// @author       [hitsulol]
// @description  Yuzu
// * G-MODE
//

// ==/UserScript==
const gameVer = '1.2.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, "200+");


setHook({
    '1.2.0': { 
		[0x83d4bda0 - 0x80004000]: mainHandler.bind_(null, 1, "Dialogue"),	
		[0x83d59320 - 0x80004000]: mainHandler.bind_(null, 0, "Choice"),
		[0x83d22530 - 0x80004000]: mainHandler.bind_(null, 0, "Map Description"),
		[0x83d225c0 - 0x80004000]: mainHandler.bind_(null, 0, "Map Memo"),
		[0x83d26fd8 - 0x80004000]: mainHandler.bind_(null, 0, "Person Description"),	
	} 
}[globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) { 
	
    const address = regs[index].value;
	console.log('onEnter: ' + hookname);
	
    /* processString */
	let s = address.add(0x14).readUtf16String();
    s = s
	.replace(/\<.*?\>/g, '') //remove HTML/ruby
	.replace(/\s/g, '') //remove any whitespace

    return s;
}