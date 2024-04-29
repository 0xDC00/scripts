// ==UserScript==
// @name         Kizuato Renewal
// @version      
// @author       [DC]
// @description  痕
// * Leaf
// * 
// ==/UserScript==
const mainHandler = trans.send(s => s, '300+');
let s = '';

const __e = Process.mainModule ?? Process.enumerateModules()[0];
(function () {
    const dialogSig1 = '68 00010000 68 00010000 6A 00 6A 00 6A 00';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const hookAddress = result.address.add(result.size);
        console.log('[DialoguesPattern] ' + hookAddress);
        Interceptor.attach(hookAddress, handler);
    }
})();

let pre = '';
let bak = '';
function handler(args) {
    console.warn('onEnter');
    // we hook at the call => -1 (returnAddress not on stack yet)
    const str = args[11 - 1].readShiftJisString();
    const idx = args[14 - 1].toInt32();
    if (str !== bak) {
        bak = str;
        console.warn(idx + ' ' + str);
    }
    else {
        console.warn(idx);
    }

    if (idx !== -1) {
        const splited = str.split('\\k');
        let s = splited[idx];
        if (pre !== s) {
            pre = s;

            // print rubi
            const re = /<R([^|]+).([^>]+)./g;
            const rubis = s.matchAll(re);
            for (const rubi of rubis) {
                console.log('rubi: ' + rubi[2]);
                console.log('rube: ' + rubi[1]);
            }

            // remove rubi
            s = s.replace(re, '$1');
            // remove control:  \n
            s = s.replace(/\\[a-z]{1}/g, '');
            // remove more control: fontSize <F52がばッ！>
            s = s.replace(/\<F[0-9]+([^>]+)./g, '$1');

            mainHandler(s);
        }
    }
}