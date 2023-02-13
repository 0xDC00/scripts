// ==UserScript==
// @name         Persona 3 Portable
// @version      0.1
// @author       Koukdw & [DC]
// @description  Windows
// * Atlus
// * 
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const { readString, createTable } = require('./libPCAtlus.js');

const mainHandler = trans.send(handler, '200+');
const table = createTable('P3P');
table[0xa] = ' '; // single line

(function () {
    const dialogSig1 = '4? ???????? C7 ?????? 01012000 0F ?? 0?';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '56 57 415?');
    if (beginSubs.length === 0) {
        console.error('[DialoguesPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address;

    Interceptor.attach(hookAddress, function (args) {
        const type = args[1].and(0xFFFF).toUInt32();
        //console.log(this.returnAddress + ' ' + type);
        if (type === 3) return null;

        mainHandler.call(this, args[0]);
    });

    // more
    const choiceSubs = Memory.scanSync(results[0].address.sub(0x200), 0x200, '56 57 415?');
    if (choiceSubs.length === 0) {
        console.error('[DialoguesPattern] no result! (3)');
        return;
    }
    const choiceAddress = choiceSubs[choiceSubs.length - 1].address;

    Interceptor.attach(choiceAddress, function (args) {
        const N = args[1].toInt32();
        let header = args[0];
        let address = header.add(4 + 4 * N);
        for (let i = 0; i < N; i++) {
            mainHandler.call(this, address);

            const offset = header.readU32();
            header = header.add(4);
            const len = header.readU32() - offset;
            address = address.add(len);
        }
    });
})();

function handler(address) {
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const s = readString(address, table);
    return s;
}