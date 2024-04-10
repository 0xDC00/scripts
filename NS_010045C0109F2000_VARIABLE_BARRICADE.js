// ==UserScript==
// @name         [010045C0109F2000] VARIABLE BARRICADE
// @version      1.0.1
// @scriptauthor [LunaLumin]
// @description  Yuzu
// @gamedev      アイディアファクトリー株式会社
//*
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x800e3424 - 0x80004000]: mainHandler.bind_(null, 0, "System Messages + Choices"), //Also includes the names of characters, but oddly makes the names appear after the text in the hook. 
        [0x800fb080 - 0x80004000]: mainHandler.bind_(null, 3, "Main Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
    * This script works for most of the text in the game. 
    * The only part that I wasn't able to get working was the tutorial messages after the prologue finished.
    * So for those parts, I recommend using an OCR like Google Lens or ShareX to capture the text.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;

    let s = address.readUtf8String();

    s = s
        .replace(/#[^\]]*\]/g, '') //Gets rid of the noise within the text like #'s and []'s. 
        .replace(/#[^n]*n/g, '')//Gets rid of the noise. 
        .replace(/\u3000/g, '') //Gets rid of the really cumbersome spacing between sentences.
        .replace(/Save[\s\S]*データ/g, ''); //Gets rid of the 50+ Empty savefiles you have from the text capture.
    return s;
}
