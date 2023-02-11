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
table[0xa] = ' '; // single line

(function () {
    const dialogSig1 = 'C7 ?????? 01012000 ???? ???????? E8';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, 'CC 48 ???????? 48');
    if (beginSubs.length === 0) {
        console.error('[DialoguesPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address.add(1);

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