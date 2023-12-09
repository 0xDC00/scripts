// ==UserScript==
// @name         [0100DCD01525A000] Persona 3 Portable
// @version      1.0.0
// @author       Koukdw & [DC]
// @description  Yuzu
// * Atlus
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const { readString, createTable } = require('./libPCAtlus.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms
const table = createTable('P3P');
table[0xa] = ' '; // single line

setHook({
    '1.0.0': {
        [0x801b9a00 - 0x80004000]: mainHandler
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const type = regs[1].value & 0xFFFF;
    //console.log(ptr(this.returnAddress) + ' ' + type);
    if (type === 3) return null;

    const address = regs[0].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const s = readString(address, table);
    return s;
}