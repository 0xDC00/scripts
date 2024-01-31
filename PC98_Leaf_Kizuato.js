// ==UserScript==
// @name         Kizuato
// @version      
// @author       [DC]
// @description  痕; Leaf Visual Novel Series Volume 2
// * Leaf
// * https://github.com/catmirrors/xlvns/blob/7a4bc8f53d6bd82b4cbee90fa9f7e538b424680c/kizuato.c#L194
// ==/UserScript==
const { setHook } = require('./libDOSBoxX.js');
const Encoding = require('./libHelperEncoding.js');

const mainHandler = trans.send(s => s, '100+');
const enc = new Encoding(__dirname + '/charsets/tblLeafKizuatoJP.txt');
let s = '';

setHook({
    //// Trigged on each charcode
    //// seg027:0106 <=> 1bed:0106
    //// like Shizuku
    //// sig: 26 8A 07 2A E4 ?? ?? ?? 3D AF 00
    //// base: 0923
    [(0x1bed << 4) + 0x0106]: lastCharHandler, // seg027:0106
    [(0x141c << 4) + 0x00a4]: lastCharHandler, // seg017:00a4
    [(0x141c << 4) + 0x103c]: lastCharHandler, // seg017:103c  fast
    [(0x141c << 4) + 0x1363]: lastCharHandler, // seg017:1363
});

// TODO: firstCharHandler (all codes like Shizuku -> Encoding)
function lastCharHandler(args) {
    const address = this.context.es.add(this.context.bx);
    const code = address.readU16();
    const l = code & 0xFF;
    if (l > 0x20) {
        if (l === 0xaf /* END */
            || l === 0xb2 /* WaitKey  */
            || l === 0xb3 /* WaitPage */) {
            console.warn('Terminated: ' + l.toString(16));
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