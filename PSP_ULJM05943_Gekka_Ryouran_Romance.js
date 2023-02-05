// ==UserScript==
// @name         [ULJM05943] Gekka Ryouran Romance
// @version      0.1
// @author       Koukdw
// @description  PPSSPP x64
// * Otomate & Rejet
// * Idea Factory (アイディアファクトリー)
// *
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(handler);

setHook({
    0x88eeba4: mainHandler.bind_(null, 0, 0), // a0 - monologue text
    0x8875e0c: mainHandler.bind_(null, 1, 6), // a1 - dialogue text
});

function handler(regs, index, offset) {
    console.log('onEnter');
    const address = regs[index].value.add(offset);

    /* processString */
    let s = address.readShiftJisString();

    // Example dialogue: #Speed[5]#Effect[0]#Scale[1]はーん……あれが、#n津森なずな
    s = s.replace(/(#n)+/g, ' ') // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, ''); // Remove controls
    return s;
}