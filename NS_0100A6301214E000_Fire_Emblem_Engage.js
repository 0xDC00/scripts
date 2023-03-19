// ==UserScript==
// @name         [0100A6301214E000] Fire Emblem Engage
// @version      1.3.0 - 1.3.0
// @author       [Sphyralg zx96]
// @description  Yuzu
// * Intelligent Systems Co., Ltd
// * Unity (il2cpp)
//
// KnowIssue: No support for 1.0.0 (yet)
// ==/UserScript==
const gameVer = '1.3.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, -200); // db leading prevemt double

setHook({
    '1.3.0': {
        0x0a48c550: mainHandler, // App.Talk3D.TalkLog$$AddLog
    }
}[globalThis.gameVer ?? gameVer]);

console.log(gameVer)


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

    const out = talker + ": " + message;

    return out;
}