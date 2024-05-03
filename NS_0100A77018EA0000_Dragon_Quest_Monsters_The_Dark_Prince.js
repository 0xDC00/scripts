// ==UserScript==
// @name         [0100A77018EA0000] Dragon Quest Monsters: The Dark Prince
// @version      1.0.6
// @author       [Kalleo]
// @description  Yuzu
// * SQUARE ENIX
// *
// ==/UserScript==
const gameVer = '1.0.6';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.6': {
        "Hb4462d78e1881de9": mainHandler.bind_(null, 1, "Text"),
        "Hbd4bb92daec3d3b2": mainHandler.bind_(null, 0, "Config Description"),
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
        .replace(/<space=-1\.00em><voffset=1em><size=50%>.*?<\/size><\/voffset><space=0\.12em>/g, "") // Remove Furigana
        .replace(/<[^>]*>/g, '') // Remove HTML Tags

    return s;
}
