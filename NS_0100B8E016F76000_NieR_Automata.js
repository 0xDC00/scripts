// ==UserScript==
// @name         [0100B8E016F76000] NieR:Automata The End of YoRHa Edition
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * PlatinumGames, Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.2': {
        [0x808e7068 - 0x80004000]: mainHandler.bind_(null, 3, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();
    s = s.replace(/お金を\d+G取得しました\s*/g, ''); // Remove money received message    
    
    return s;
}