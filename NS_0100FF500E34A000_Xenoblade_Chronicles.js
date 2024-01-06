// ==UserScript==
// @name         [0100FF500E34A000] Xenoblade Chronicles: Definitive Edition
// @version      1.1.2
// @author       [Kalleo]
// @description  Yuzu
// * Monolith Soft, Nintendo
// *
// ==/UserScript==
const gameVer = '1.1.2';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, 200);
const mainHandler2 = trans.send(handler, '200+');
const itemDescriptionHandler = trans.send(handler, -200);
const itemNameHandler = trans.send(handler, -200);

setHook({
    '1.1.2': {
        [0x808a5670 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
        [0x80305968 - 0x80004000]: mainHandler2.bind_(null, 1, "Choices"),
        [0x8029edc8 - 0x80004000]: itemNameHandler.bind_(null, 0, "Item Name"),
        [0x8029ede8 - 0x80004000]: itemDescriptionHandler.bind_(null, 0, "Item Description"),
        [0x8026a454 - 0x80004000]: mainHandler2.bind_(null, 0, "Acquired Item Name"),
        [0x803c725c - 0x80004000]: mainHandler2.bind_(null, 0, "Acquired Item Notification"),
        [0x802794cc - 0x80004000]: mainHandler.bind_(null, 0, "Location Discovered"),
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    // Remove anything inside [] -> Remove line breaks
    s = s.replace(/\[.*?\]/g, '').replace(/\n+/g, ' '); 

    return s;
}