// ==UserScript==
// @name         [010079201BD88000] Tokimeki Memorial Girl’s Side 2nd Season for Nintendo Switch
// @version      1.0.1
// @author       [zooo]
// @description  Yuzu
// * KONAMI
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = '1.0.1';
trans.replace(function (s) {
    return s
        .replace(/▼/g, '♡')        ;
    });
    //------------------------------------------------

const decoder = new TextDecoder('utf-16');
const { setHook } = require('./libYuzu.js');

const nameHandler = trans.send(handler, '300+'); // join 250ms
const dialogueHandler = trans.send(handler, '200+'); // join 200ms


setHook({
    '1.0.1': {

        [0x82058848 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue1"),
        [0x82058aa0 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue2"),
        [0x8205a244 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue3"),

        [0x826ee1d8 - 0x80004000]: dialogueHandler.bind_(null, 0, "choice"),

        [0x8218e258 - 0x80004000]: dialogueHandler.bind_(null, 0, "news"),
        [0x823b61d4 - 0x80004000]: dialogueHandler.bind_(null, 0, "mail"),

        [0x82253454 - 0x80004000]: dialogueHandler.bind_(null, 0, "luckyitem"),
        [0x82269240 - 0x80004000]: dialogueHandler.bind_(null, 0, "profile1"),
        [0x82269138 - 0x80004000]: dialogueHandler.bind_(null, 0, "profile2"),
        [0x822691ec - 0x80004000]: dialogueHandler.bind_(null, 0, "profile3"),
        [0x82269198 - 0x80004000]: dialogueHandler.bind_(null, 0, "profile4"),



    }

}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    console.log('onEnter');


    console.log('onEnter: ' + hookname);
    const address = reg.value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/[\s]/g,'');
    s = s.replace(/\\n/g,'');

    return s;
}
