// ==UserScript==
// @name         Shizuku
// @version      
// @author       [DC]
// @description  雫 -しずく-; Drip; Leaf Visual Novel Series Volume 1
// * Leaf
// * https://github.com/catmirrors/xlvns/blob/7a4bc8f53d6bd82b4cbee90fa9f7e538b424680c/sizuku.c#L225
// ==/UserScript==
const { setHook } = require('./libDOSBoxX.js');
const Encoding = require('./libHelperEncoding.js',);

const mainHandler = trans.send(s => s, '150+');
const enc = new Encoding(__dirname + '/data/tblLeafShizukuJP.txt');
let enable = true;

setHook({
    //// Trigged on each charcode
    //// seg013:0096 <=> 230b:0096  les bx, [bp+0Ah] ; es=[ds+bp+0xA+2] and bx=[ds+bp+0xA]
    //// because we use ES => hook at next address
    //// sig: 26 8A 07 2A E4 ?? ?? ?? 3D 24 00
    //// base: 1a45
    [(0x230b << 4) + 0x009c]: firstCharHandler, // seg013:009c (0x2314c)
    [(0x230b << 4) + 0x1048]: firstCharHandler, // seg013:1048
    [(0x230b << 4) + 0x150c]: firstCharHandler, // seg013:150c
    [(0x2906 << 4) + 0x00c5]: firstCharHandler, // seg023:00c5
});

function firstCharHandler(args) {
    const address = this.context.es.add(this.context.bx);
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