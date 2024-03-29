// ==UserScript==
// @name         [0100B0100E26C000] Tokimeki Memorial Girl's Side: 4th Heart
// @version      1.0.0
// @author       [DC]
// @description  Yuzu
// * KONAMI
// * Unity (il2cpp)
//
// KnowIssue: first line (missed)
// い
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler.bind_(null, 2, 0)); // x2
const choiceHandler = trans.send(handler.bind_(null, 0, 1), '250+'); // join 250ms; x0
const helpHandler = trans.send(handler.bind_(null, 1, 2)); // x1

setHook({
    '1.0.0': {
        [0x817e7da8 - 0x80004000]: mainHandler,   // name (x1) + dialogue (x2)
        [0x81429f54 - 0x80004000]: choiceHandler, // choice (x0)
        [0x8180633c - 0x80004000]: helpHandler,   // help (x1)
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let currentType = -1;
let previousType = -1;
let previousString = '';
trans.replace(s => {
    if (currentType === 1 && previousType === 0) {
        s = previousString + '\n' + s;  // text + choice
    }
    return s;
});

function handler(regs, index, type) {
    let address = regs[index].value;
    console.log('onEnter');

    /* processString */
    if (type === 2) {
        address = address.add(0xA);
    }

    const len = address.add(0x10).readU32() * 2;
    if (len === 0) return null;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replace(/\n+|(\\n)+/g, ' ');

    if (type === 0) {
        // backup for choice (without name)
        previousString = s;

        // add name
        const nameAdr = regs[1].value;
        const nameLen = nameAdr.add(0x10).readU32() * 2;
        if (nameLen !== 0) {
            const name = nameAdr.add(0x14).readUtf16String(nameLen);
            s = name + "\n" + s;
        }
    }

    if (currentType !== type) {
        previousType = currentType;
        currentType = type;
    }

    return s;
}