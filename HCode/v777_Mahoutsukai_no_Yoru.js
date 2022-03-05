// ==UserScript==
// @name         Mahoutsukai no Yoru
// @version      
// @author       Textractor
// @description  
// * KiriKiri v2.32.2010.425
// * https://krkrz.github.io/
// ==/UserScript==

/*
https://github.com/Artikash/Textractor/blob/aa0c0e0047685b502934fe7ba855b7a7be0a5836/texthook/engine/engine.cc#L463
/HW-4*14:-4*0@1137D0:魔法使いの夜.exe
Compiler: Borland C++
*/

const { setHook } = require('../PC_HCode.js');

setHook('/HW-4*14@1137D0:', {
    threads: {
        ':$0x119fc6': true
    }
});