// ==UserScript==
// @name         [010062B01525C000] Persona 4 Golden
// @version      0.1 - 1.0.0 (base)
// @author       Koukdw & [DC]
// @description  Yuzu
// * Atlus
// * 
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const { readString, createTable } = require('./libPCAtlus.js');

const mainHandler = trans.send(handler, '200+'); // join 200ms
const table = createTable('P4G');
table[0xa] = ' '; // single line

setHook({
    '1.0.0': {
        0x82d5ba0: mainHandler
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const type = regs[1].value & 0xFFFF;
    //console.log(ptr(this.returnAddress) + ' ' + type);
    if (type === 3) return null;

    const address = regs[0].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const s = readString(address, table);
    return s;
}