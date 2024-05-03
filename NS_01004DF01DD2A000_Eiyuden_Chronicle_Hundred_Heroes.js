// ==UserScript==
// @name         [01004DF01DD2A000] Eiyuden Chronicle: Hundred Heroes
// @version      1.01 - 1.0.3
// @author       [Kalleo]
// @description  Yuzu
// * 505 Games
// *
// ==/UserScript==
const gameVer = '1.0.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.01': {
        "Hbbf68ca2c0823253": mainHandler.bind_(null, 0, "Text"),
        "H506c8882792f654e": mainHandler.bind_(null, 0, "Action Text"),
        "Hddc27f3120605a10": mainHandler.bind_(null, 0, "Choices"),
        "H2b77f66ce138b9b5": mainHandler.bind_(null, 1, "Info Title"),
        "Hdacbe621a5a2895e": mainHandler.bind_(null, 2, "Info Description"),
        "H1256a912f2e420b4": mainHandler.bind_(null, 1, "Config Description"),
        "Hc458f18e275909c0": mainHandler.bind_(null, 0, "Tutorial Description"),
        "H15ba158e73f99519": mainHandler.bind_(null, 0, "Tutorial Header"),
    },
    '1.0.2': {
        "H1a98d00ad4ace155": mainHandler.bind_(null, 0, "Text"),
        "H91e46ea2bd93593a": mainHandler.bind_(null, 0, "Action Text"),
        "Hd9090ccaff554f83": mainHandler.bind_(null, 1, "Choices"),
        "H657b13ce1c5a9742": mainHandler.bind_(null, 2, "Info Title"),
        "H47f92004cec752ce": mainHandler.bind_(null, 3, "Info Description"),
        "H3dec18d0b3cab73b": mainHandler.bind_(null, 0, "Config Description"),
        "H04ff99315dbd575e": mainHandler.bind_(null, 0, "Tutorial Description"),
        "H3facc7f0aa142379": mainHandler.bind_(null, 0, "Tutorial Header"),
    },
    '1.0.3': {
        "H780b9a9953764e4e": mainHandler.bind_(null, 1, "Text"),
        "Hb39168056816e127": mainHandler.bind_(null, 0, "Action Text"),
        "Ha7c0f405086d352b": mainHandler.bind_(null, 0, "Choices"),
        "Hf9e8c4b175827883": mainHandler.bind_(null, 1, "Info Title"),
        "H500726519422db07": mainHandler.bind_(null, 2, "Info Description"),
        "H08f24b44230161db": mainHandler.bind_(null, 0, "Config Description"),
        "H627520e962e95a29": mainHandler.bind_(null, 0, "Tutorial Description"),
        "H8887e8bd21780481": mainHandler.bind_(null, 0, "Tutorial Header"),
    }
}, globalThis.gameVer = globalThis.gameVer ?? gameVer);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);

    s = s
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/^(?:獲得)$(\r?\n|\r)?/gm, '') // Removing commands

    return s;
}
