// ==UserScript==
// @name         [0100FC2019346000] Princess Arthur
// @version      1.0.0
// @author       [GO123]
// @description  Yuzu
// * Design Factory Co., Ltd. & Otomate
//*
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.0': {
        [0x80066e10 - 0x80004000]: mainHandler.bind_(null, 2, "Dialogue text"), // Dialogue text 
        [0x8001f7d0 - 0x80004000]: mainHandler.bind_(null, 0, "Name"),// name
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    //console.log('onEnter ' + hookname);

    const address = regs[index].value;

    /* processString */
     let s = address.readShiftJisString();
         s = s.replace(/#n/g,'') ;
       
   
    return s;
}
