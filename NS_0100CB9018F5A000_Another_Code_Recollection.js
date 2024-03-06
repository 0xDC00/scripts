// ==UserScript==
// @name         [0100CB9018F5A000] Another Code: Recollection
// @version      1.0.0
// @author       [Kalleo]
// @description  Yuzu
// * Arc System Works
//*
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x82dcad30 - 0x80004000]: mainHandler.bind_(null, 1, "Main Text"),
        [0x82f2cfb0 - 0x80004000]: mainHandler.bind_(null, 0, "Item Description"),
        [0x82dcc5fc - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial PopUp Header"),
        [0x82dcc61c - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial PopUp Description"), 
        [0x82f89e78 - 0x80004000]: mainHandler.bind_(null, 0, "Aproach Text"),
        [0x82973300 - 0x80004000]: mainHandler.bind_(null, 1, "Chapter"),
        [0x82dd2604 - 0x80004000]: mainHandler.bind_(null, 0, "Location"),
        [0x82bcb77c - 0x80004000]: mainHandler.bind_(null, 1, "Save Message"),
        [0x828ccfec - 0x80004000]: mainHandler.bind_(null, 0, "Acquired Item"),
        [0x83237b14 - 0x80004000]: mainHandler.bind_(null, 0, "Question Options"),
        [0x82dcee10 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Header"),
        [0x82dcee38 - 0x80004000]: mainHandler.bind_(null, 0, "Tutorial Description"),
        [0x82e5cadc - 0x80004000]: mainHandler.bind_(null, 0, "Character Info Name"),
        [0x82e5cc38 - 0x80004000]: mainHandler.bind_(null, 0, "Character Info Description"),
        [0x82871ac8 - 0x80004000]: mainHandler.bind_(null, 0, "Letter Message"),
        [0x82e4dad4 - 0x80004000]: mainHandler.bind_(null, 0, "アナザーキー"),
        [0x82bd65d0 - 0x80004000]: mainHandler.bind_(null, 0, "Message Title"),
        [0x82bd65f0 - 0x80004000]: mainHandler.bind_(null, 0, "Message Content"),
        [0x82c1ccf0 - 0x80004000]: mainHandler.bind_(null, 0, "Decision Header"),
        [0x82c1d218 - 0x80004000]: mainHandler.bind_(null, 0, "Decision1"),
        [0x82c1e43c - 0x80004000]: mainHandler.bind_(null, 0, "Decision2"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    // console.log('onEnter: ' + hookname);

    const address = regs[index].value;

    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    
    s = s
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\{([^{}]+):[^{}]+\}/g, '$1'); // Remove furigana formatting {年:ねん} to just 年

    return s;
}
