// ==UserScript==
// @name         [01006530151F0000] Kamigami no Asobi - Unite Edition
// @version      0.1 - 1.0.0
// @author       [DC]
// @description  Yuzu
// * 株式会社ブロッコリー（英: BROCCOLI Co., Ltd.）
// * Unity (il2cpp)
//
// KnowIssue: [Ludere Deorum] first line (missed)
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, -200); // db leading prevemt double

setHook({
    '1.0.0': {
        //[0x812f1e60 - 0x80004000]: mainHandler, // (trigged multiple: text animate, noname)
        [0x812f1b8c - 0x80004000]: mainHandler, // ADVManager._ShowTextCoroutine_d__564$$MoveNext (+0x30); name + text (trigged one)
    }
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[1].value; // name
    console.log('onEnter');

    /* processString */
    // public class ADVManager
    //    ...
    //    private string _maintext; // 0x1E0

    // ADVManager._maintext: [x19+0x1E0]
    let x19 = regs[19]; // ADVManager
    x19.vm += 0x1E0;
    let vmPtr = x19.value.readU64();
    // guest -> host
    x19.vm = vmPtr; // x19 as tmp
    let adr = x19.value;

    let slen = adr.add(0x10).readU32() * 2;
    let s = adr.add(0x14).readUtf16String(slen);
    //console.log(hexdump(adr, { header: false, ansi: false, length: 0x50 }));

    // remove controls
    s = s.replace(/\n+/g, ' ');

    // add name
    const len = address.add(0x10).readU32() * 2;
    if (len !== 0) {
        let name = address.add(0x14).readUtf16String(len);
        s = name + '\n' + s;
    }

    return s;
}