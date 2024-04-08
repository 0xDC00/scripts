// ==UserScript==
// @name         Shizuku
// @version      
// @author       [DC]
// @description  雫 -しずく-; Drip; Leaf Visual Novel Series Volume 1
// * Leaf
// * https://github.com/catmirrors/xlvns/blob/7a4bc8f53d6bd82b4cbee90fa9f7e538b424680c/sizuku.c#L225
// ==/UserScript==
const Encoding = require('./libHelperEncoding.js');

const mainHandler = trans.send(s => s, '150+');
const enc = new Encoding(__dirname + '/charsets/tblLeafShizukuJP.txt');
let enable = true;

//// sig: 66 3D 24 00
// // movzx ax, byte ptr [esi]; inc esi
// Interceptor.attach(ptr(0x00404F81), firstCharHandler.bind_(null, "onEnter"));
// // movzx ax, byte ptr [esi]; inc esi
// Interceptor.attach(ptr(0x004064A3), firstCharHandler.bind_(null, "onEnter_2"));
// // inc esi; movzx ax, byte ptr [esi-1]
// Interceptor.attach(ptr(0x004062BA), firstCharHandler.bind_(null, "onEnter_3"));

const __e = Process.enumerateModules()[0];
(function () {
    const dialogSig1 = '46 66 3? 24 00';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    for (let i = 0; i < results.length; i++) {
        const hookAddress = results[i].address;
        console.log('[DialoguesPattern] ' + hookAddress);
        Interceptor.attach(hookAddress, firstCharHandler);
    }
})();

(function () {
    const dialogSig1 = '46 66??????FF 66 3? 24 00';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    for (let i = 0; i < results.length; i++) {
        const hookAddress = results[i].address;
        console.log('[DialoguesPattern] ' + hookAddress);
        Interceptor.attach(hookAddress, firstCharHandler);
    }
})();

function firstCharHandler(args) {
    const address = this.context.esi;
    const code = address.readU16();
    const l = code & 0xFF;
    if (l < 0x80) {
        if (enc.isEndCode(l) === true) {
            enable = true;
        }
    }
    else {
        if (enable === true) {
            enable = false;
            console.warn("onEnter");
            const s = enc.readString(address).trim();
            if (s.length !== 0) {
                mainHandler(s);
            }
        }
    }
}