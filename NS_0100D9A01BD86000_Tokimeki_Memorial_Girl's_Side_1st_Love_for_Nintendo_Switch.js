// ==UserScript==
// @name         [0100D9A01BD86000] Tokimeki Memorial Girl's Side 1st Love for Nintendo Switch
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

const dialogueHandler = trans.send(handler, '200+'); // join 200ms
const mainHandler = trans.send(handler, '200+'); // join 200ms

setHook({
    '1.0.1': {

        [0x822454a4 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue1"),
        [0x82247138 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue2"),
        [0x822472e0 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue3"),

        [0x82156988 - 0x80004000]: mainHandler.bind_(null, 0, "choice"),
        [0x82642200 - 0x80004000]: mainHandler.bind_(null, 2, "option1"),
        [0x81ecd758 - 0x80004000]: mainHandler.bind_(null, 0, "option2"),
        [0x823185e4 - 0x80004000]: mainHandler.bind_(null, 0, "mail"),
        [0x823f2edc - 0x80004000]: mainHandler.bind_(null, 0, "roomDescript"),
        [0x821e3cf0 - 0x80004000]: mainHandler.bind_(null, 0, "dateDescript"),
        [0x81e20050 - 0x80004000]: mainHandler.bind_(null, 0, "characterDesc1"),
        [0x81e1fe50 - 0x80004000]: mainHandler.bind_(null, 0, "characterDesc2"),
        [0x81e1feb0 - 0x80004000]: mainHandler.bind_(null, 0, "characterDesc3"),
        [0x81e1ff04 - 0x80004000]: mainHandler.bind_(null, 0, "characterDesc4"),
        [0x821d03b0 - 0x80004000]: mainHandler.bind_(null, 3, "news"),
        [0x82312008 - 0x80004000]: mainHandler.bind_(null, 0, "luckyitem"),

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