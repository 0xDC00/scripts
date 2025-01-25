// ==UserScript==
// @name         [0100A6301214E000] Fire Emblem Engage
// @version      1.3.0, 2.0.0
// @author       [Sphyralg zx96]
// @description  Yuzu
// * Intelligent Systems Co., Ltd
// * Unity (il2cpp)
//
// KnowIssue: No support for 1.0.0 (yet)
// ==/UserScript==
const gameVer = '2.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, "200+");// join 200ms

setHook({
    '1.3.0': {
        [0x8248c550 - 0x80004000]: mainHandler, // App.Talk3D.TalkLog$$AddLog
    },
    '2.0.0': {
        [0x820C6530 - 0x80004000]: mainHandler, // App.Talk3D.TalkLog$$AddLog
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(gameVer);


function readSystemString(addr) {
    const slen = addr.add(0x10).readU32() * 2;
    const s = addr.add(0x14).readUtf16String(slen);
    return s;
}

function handler(regs) {
    //console.log("on enter")

    const x2 = regs[2]; // Message
    const message = readSystemString(x2.value)

    const x3 = regs[3] // Speaker
    const talker = readSystemString(x3.value)

    const out = talker + '\n' + message.replace(/\n+/g, ' ');

    return out;
}