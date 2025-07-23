// ==UserScript==
// @name         [0100DA2019044000] Ketsugou Danshi -Elements with Emotions-
// @version      1.0.3
// @author       [Owlie]
// @description  Yuzu
// * SQUARE ENIX
// ==/UserScript==
const gameVer = '1.0.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.3': {
        [0x81efb590 - 0x80004000]: mainHandler.bind_(null, 0, "Dialogue"),
        //[0x81eb8120 - 0x80004000]: mainHandler.bind_(null, 1, "Choice"),
    
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);


function handler(regs, index, hookname) {
    //console.log('onEnter: ' + hookname);
    const address = regs[index].value;
    //console.log('onEnter');

    const len = address.add(0x10).readU16() * 2;
    let s = address.add(0x14).readUtf16String(len);
  
    // Remove content within < > brackets
    s = s.replace(/<[^>]*>/g, '');

    // Remove furigana enclosed within square brackets
    s = s.replace(/\[([^\]\/]+)\/[^\]]+\]/g, '$1');

    // Remove remaining $ symbols
    s = s.replace(/\$/g, '');
    s = s.replace(/\n+/g, ' ');                             

        return s;
    }







