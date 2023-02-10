// ==UserScript==
// @name         Persona 5 Royal
// @version      0.1
// @author       Koukdw & [DC]
// @description  Windows
// * Atlus
// * 
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const { readString, createTable } = require('./libPCAtlus.js');

const mainHandler = trans.send(handler, '200+');
const table = createTable('P5R');
table[0xa] = ' ';

(function () {
    const dialogSig1 = '48 895C24 08  48 896C24 10  48 897424 18  57  48 81EC ??000000  48 ????  48 ????  BA ??000000  48 8D4C24 ??  41 ????  41 ???? E8 ???????? 48';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    const hookAddress = results[0].address;

    Interceptor.attach(hookAddress, {
        onEnter(args) {
            const type = args[2].and(0xFFFF).toUInt32();
            //console.log(this.returnAddress + ' ' + type);
            if (type === 3 || type === 4) return null;

            mainHandler.call(this, args[1]);
        }
    });
})();


function handler(address) {
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const s = readString(address, table);
    return s;
}