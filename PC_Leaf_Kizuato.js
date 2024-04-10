// ==UserScript==
// @name         Kizuato
// @version      
// @author       [DC]
// @description  痕; Leaf Visual Novel Series Volume 2
// * Leaf
// * https://github.com/catmirrors/xlvns/blob/7a4bc8f53d6bd82b4cbee90fa9f7e538b424680c/kizuato.c#L194
// ==/UserScript==
const Encoding = require('./libHelperEncoding.js');

const mainHandler = trans.send(s => s, '100+');
const enc = new Encoding(__dirname + '/charsets/tblLeafKizuatoJP.txt');
let s = '';

//// sig: 66 0F B6 ?? 46
// // movzx bx, byte ptr [esi]; 66 0F B6 ??  46  66 81 FB AF 00
// Interceptor.attach(ptr(0x004010F3), lastCharHandler.bind_(null, "Terminated: ")); // dialogue+menu
// // movzx ax, byte ptr [esi]; 66 0F B6 ??  46  66 3D AF 00
// Interceptor.attach(ptr(0x00402107), lastCharHandler.bind_(null, "Terminated_2: ")); // fast
// // movzx cx, byte ptr [esi]; 66 0F B6 ??  46  66 81 F9 AF 00
// Interceptor.attach(ptr(0x004070C4), lastCharHandler.bind_(null, "Terminated_3: ")); // dialogue

const __e = Process.enumerateModules()[0];
(function () {
    const dialogSig1 = '66 0F B6 ??  46  66 81 ?? AF 00';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    for (let i = 0; i < results.length; i++) {
        const hookAddress = results[i].address;
        console.log('[DialoguesPattern] ' + hookAddress);
        Interceptor.attach(hookAddress, lastCharHandler);
    }
})();

(function () {
    const dialogSig1 = '66 0F B6 ??  46  66 3D AF 00';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    for (let i = 0; i < results.length; i++) {
        const hookAddress = results[i].address;
        console.log('[DialoguesPattern] ' + hookAddress);
        Interceptor.attach(hookAddress, lastCharHandler);
    }
})();

// TODO: firstCharHandler (all codes like Shizuku -> Encoding)
function lastCharHandler(args) {
    const address = this.context.esi;
    const code = address.readU16();
    const l = code & 0xFF;
    if (l > 0x20) {
        if (l === 0xaf /* END */
            || l === 0xb2 /* WaitKey  */
            || l === 0xb3 /* WaitPage */) {
            console.warn("Terminated: " + l.toString(16));
            s = s.trim();
            if (s.length !== 0) {
                mainHandler(s);
            }
            s = '';
        }
        else if (l === 0xb0) {
            s += ''; // newline -> empty
        }
        else {
            //// do nothing
            // 0x25 WaitSelect
            // 0x27 SetSavePoint
            // ...
        }
    }
    else {
        s += enc.fromCharCode(l << 8 | code >> 8);
    }
    //console.log(enc.fromCharCode(l << 8 | code >> 8));
}