// ==UserScript==
// @name         Persona 4 Golden
// @version      0.1
// @author       Koukdw & [DC]
// @description  Windows
// * Atlus
// * 
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const { readString, createTable } = require('./libPCAtlus.js');

const mainHandler = trans.send(handler, '200+');
const table = createTable('P4G');
table[0xa] = ' '; // single line

(function () {
    const dialogSig1 = 'C1??07 83??1E ?????? ?????? ???????? ?????? 75?? 81?? 21F10000 74';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x400), 0x400, '56 57 ???? 48');
    if (beginSubs.length === 0) {
        console.error('[DialoguesPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address;

    Interceptor.attach(hookAddress, {
        onEnter(args) {
            const type = args[1].and(0xFFFF).toUInt32();
            //console.log(this.returnAddress + ' ' + type);
            if (type === 3) return null;

            mainHandler.call(this, args[0]);
        }
    });
})();


function handler(address) {
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const s = readString(address, table);
    return s;
}