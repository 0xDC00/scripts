// ==UserScript==
// @name         [0100936018EB4000] Story of Seasons a Wonderful Life
// @version      1.0.3
// @author       [Kalleo]
// @description  Yuzu
// *　Marvelous
// *
// ==/UserScript==
const gameVer = '1.0.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.3': {
        [0x80ac4d88 - 0x80004000]: mainHandler.bind_(null, 0, "main text"), // Main text
        [0x808f7e84 - 0x80004000]: mainHandler.bind_(null, 0, "item name"), // Item name
        [0x80bdf804 - 0x80004000]: mainHandler.bind_(null, 0, "item description"), // Item description
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    //console.log('onEnter', hookname);

    /* processString */
    let s = address.readUtf32StringLE();
    s = s.replace(/<[^>]+>/g, ''); // Remove characters inside < >
    s = s.replace(/\n+/g, ' '); // Remove line breaks

    return s;
}