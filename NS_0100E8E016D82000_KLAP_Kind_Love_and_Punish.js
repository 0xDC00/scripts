// ==UserScript==
// @name         [0100E8E016D82000] KLAP!! ~Kind Love And Punish~
// @version      1.0.0
// @author       kenzy
// @description  Yuzu/Sudachi, Ryujinx
// * Design Factory & Otomate
// * Idea Factory
// ==/UserScript==

const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const dictHandler = trans.send(handlerDict, '200+'); 

setHook({
    '1.0.0': {
        [0x8004a2d0 - 0x80004000]: mainHandler.bind_(null, 1, "dialogue"),
        [0x8004970c - 0x80004000]: mainHandler.bind_(null, 1, "choices"),
        [0x800da5e0 - 0x80004000]: dictHandler.bind_(null, 0, "dict popup"),  
        [0x8003dfac - 0x80004000]: dictHandler.bind_(null, 0, "dict menu") 
        // missing names
    }
    
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

// string processing
function handler(regs, index, hookname) {
    const address = regs[index].value;
    let s = processString(address);    
    return s;
}
function handlerDict(regs, index, hookname) {
    const address = regs[index].value;
    let s = processString(address);
    return s;
}
function processString(address) {
    return address.readUtf8String()
        .replace(/(#n)+/g, ' ') 
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, ''); 
        
}
