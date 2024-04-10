// ==UserScript==
// @name         [01002C0008E52000] Tales of Vesperia: Definitive Edition
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Bandai Namco
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, -200);

setHook({
    '1.0.2': {
        [0x802de170 - 0x80004000]: mainHandler2.bind_(null, 2, "Ptc Text"),
        [0x802cf170 - 0x80004000]: mainHandler.bind_(null, 3, "Cutscene"),
        [0x8019957c - 0x80004000]: mainHandler.bind_(null, 0, "Conversation"),
        [0x802c0600 - 0x80004000]: mainHandler.bind_(null, 2, "Info"),
        [0x801135fc - 0x80004000]: mainHandler.bind_(null, 0, "Post Battle Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf8String();

    s = s
    .replace(/(YUR)/g, 'ユーリ')
    .replace(/(FRE)/g, 'フレン')
    .replace(/(RAP)/g, 'ラピード')
    .replace(/(EST)/g, 'エステル')
    .replace(/(ESU)/g, 'エステル')
    .replace(/(KAR)/g, 'カロル')
    .replace(/(RIT)/g, 'リタ')
    .replace(/(RAV)/g, 'レイヴン')
    .replace(/(REI)/g, 'レイヴン')
    .replace(/(JUD)/g, 'ジュディス')
    .replace(/(PAT)/g, 'パティ')
    .replace(/(DUK)/g, 'デューク')
    .replace(/(DYU)/g, 'デューク')
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/[,(-)_]/g, '') // Remove specified symbols
    .replace(/^\s+/, '') // Trim spaces if the sentence starts with one
    .replace(/^\s*$/gm, '') // Remove empty lines

    return s;
}