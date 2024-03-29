// ==UserScript==
// @name         [010093800DB1C000] Jakou no Lyla ~Trap of MUSK~
// @version      1.0.0
// @author       [DC]
// @description  Yuzu
// * Idea Factory (アイディアファクトリー)
// * 
// ==/UserScript==
const gameVer = '1.0.0';

if (!NativePointer.prototype.readUtf32String) {
    const decoder = new TextDecoder('utf-32le');
    NativePointer.prototype.readUtf32String = function (len = -1) {
        if (len === -1) {
            len = -4;
            do {
                len += 4;
            } while (this.add(len).readU32() !== 0);
        }
        const buf = ArrayBuffer.wrap(this, len);
        return decoder.decode(new Uint8Array(buf));
    }
}

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '250+'); // join: separator=': ' (250+: +)

setHook({
    '1.0.0': {
        /* 1. European night */
        [0x80167100 - 0x80004000]: mainHandler, // x1 text + name (unformated), #T1 #T2, #T0
        [0x801589a0 - 0x80004000]: mainHandler, // x0=x1=choice (sig=SltAdd)

        /* 2. Asian night */
        [0x801b4300 - 0x80004000]: mainHandler, // x1 text + name (unformated), #T1 #T2, #T0
        [0x802a9170 - 0x80004000]: mainHandler, // x0=x1=choice (sig=SltAdd)

        /* 3. Arabic night */
        [0x80301e80 - 0x80004000]: mainHandler, // x1 text + name (unformated), #T1 #T2, #T0
        [0x803f7a90 - 0x80004000]: mainHandler, // x0=x1=choice (sig=SltAdd)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    console.log('onEnter');
    const address = regs[1].value; // name
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x100 }));

    /* processString */
    let s = address.readUtf32String();

    s = s.replace(/\n+/g, ' ');

    s = s.replaceAll('${FirstName}', 'シリーン');

    if (s.startsWith('#T')) {
        s = s.replace(/\#T2[^#]+/g, ''); // \#T2[^#]+ || \#T2[^\n]+ (\n=space)
        s = s.replace(/\#T\d/g, '');
    }

    return s;
}