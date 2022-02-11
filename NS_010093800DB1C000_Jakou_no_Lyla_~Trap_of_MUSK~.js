// ==UserScript==
// @name         [010093800DB1C000] Jakou no Lyla ~Trap of MUSK~
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * 
// ==/UserScript==
const gameVer = '1.0.0';

if (!NativePointer.prototype.readUtf32String) {
    const decoder = new TextDecoder('utf-32le');
    NativePointer.prototype.readUtf32String = function(len = -1) {
        if (len === -1) {
            len = -4;
            do {
                len += 4;
            } while(this.add(len).readU32() !== 0);
        }
        const buf = ArrayBuffer.wrap(this, len);
        return decoder.decode(new Uint8Array(buf));
    }
}

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+');

setHook({
    '1.0.0': {
        0x8167100: mainHandler, // text + name
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    console.log('onEnter');
    const address = regs[1].value; // name
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.readUtf32String();
    s = s.replace(/\n+/, ' ');
    
    return s;
}