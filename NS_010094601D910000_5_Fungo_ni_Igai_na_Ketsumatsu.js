// ==UserScript==
// @name         [010094601D910000] 5分後に意外な結末　モノクロームの図書館
// @version      1.0.1
// @author       hitsulol
// @description  Yuzu
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+');

setHook({
    '1.0.1': {
        [0x81fa4890 - 0x80004000]: mainHandler.bind_(null, 1, "book text" ),
        [0x81fa5250 - 0x80004000]: mainHandler.bind_(null, 1, "book text"),
        [0x81b1c68c - 0x80004000]: mainHandler.bind_(null, 0, "choice1"),
        [0x81b1c664 - 0x80004000]: mainHandler.bind_(null, 0, "choice2"),
        [0x81b1e5b0 - 0x80004000]: mainHandler.bind_(null, 3, "dialogue"),
        //[0x81ec5660 - 0x80004000]: mainHandler.bind_(null, 0, "book names"),
        //[0x81ec6910 - 0x80004000]: mainHandler.bind_(null, 0, "categories"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value.add(0x14);

    let s = address.readUtf16String();
    
    s = s.replace(/\<.*?\>/g, '')
		.replace(/\[.*?\]/g, '')
		.replace(/\s/g, ''); 

    return s;
}
