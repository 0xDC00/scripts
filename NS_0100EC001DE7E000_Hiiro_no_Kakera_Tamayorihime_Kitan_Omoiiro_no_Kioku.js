// ==UserScript==
// @name         [0100EC001DE7E000] Hiiro_no_Kakera_Tamayorihime_Kitan_Omoiiro_no_Kioku
// @version      1.0.0
// @author       GO123
// @description  Ryujinx
// * Design Factory Co., Ltd. & Otomate
// *Idea Factory Co., Ltd.
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll(/<\w+=[^>]+>|<\/\w+>/g, '')

        ;
});
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.0': {
        [0x81922ce8 - 0x80004000]: mainHandler.bind_(null, 0, "Dialogue text"),


    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    

    const address = regs[index].value;
    //console.log("onEnter: " + hookname);
    // console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    let s = address.add(0x14).readUtf16String()

    return s;
}
