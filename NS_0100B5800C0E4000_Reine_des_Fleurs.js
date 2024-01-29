// ==UserScript==
// @name         [0100B5800C0E4000] Reine des Fleurs
// @version      1.0.0
// @author       [Owlie]
// @description  Yuzu
// * Design Factory Co., Ltd. & Otomate
//*
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.0': {
        [0x80026434 - 0x80004000]: mainHandler.bind_(null, 0, "Dialogue text"), // Dialogue text 
    
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    //console.log('onEnter ' + hookname);

    const address = regs[index].value;

    /* processString */
    let s = address.readUtf8String()
        //.replace(/\s+/g, ' ') // Replace any sequence of whitespace characters with a single space
       // .replace(/\\n/g, ' ') // Replace '\n' with a space
   
    return s;
}