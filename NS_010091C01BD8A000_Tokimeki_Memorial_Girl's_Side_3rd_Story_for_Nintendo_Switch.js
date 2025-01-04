// ==UserScript==
// @name         [010091C01BD8A000] Tokimeki Memorial Girl’s Side 3rd Story for Nintendo Switch
// @version      1.0.1
// @author       [CISAC]
// @description  Yuzu
// * KONAMI
// * Unity (il2cpp)
// ==/UserScript==
const gameVer = '1.0.1';
trans.replace(function (s) {
    return s
        .replace(/▼/g, '♡');
});
//------------------------------------------------

const { setHook } = require('./libYuzu.js');

const nameHandler = trans.send(handler, '200+'); // join 250ms
const dialogueHandler = trans.send(handler, '200+'); // join 200ms


setHook({
    '1.0.1': {

        [0x82270d80 - 0x80004000]: dialogueHandler.bind_(null, 2, "dialogue"), //check
        //[0x8220b384 - 0x80004000]: dialogueHandler.bind_(null, 0, "dialogue2"), //add conditional dialogue, skinship reactions
        [0x82270c60 - 0x80004000]: dialogueHandler.bind_(null, 2, "cond_dialogue"), //add conditional dialogue, skinship reaction
        //[0x82270e20 - 0x80004000]: dialogueHandler.bind_(null, 2, "dialogue4"), //add dialogue after date

        [0x81b6d300 - 0x80004000]: dialogueHandler.bind_(null, 0, "choice"), //correct

        //[0x8220b1cc - 0x80004000]: mainHandler.bind_(null, 0, "MIYOoption1"),
        //[0x820e8fb8 - 0x80004000]: mainHandler.bind_(null, 1, "MIYOoption2"),
        //[0x820e8fb8 - 0x80004000]: mainHandler.bind_(null, 1, "MIYOoption3"),

        //[0x82642200 - 0x80004000]: mainHandler.bind_(null, 2, "option1"),
        //[0x81ecd758 - 0x80004000]: mainHandler.bind_(null, 0, "option2"),

        //[0x823f2edc - 0x80004000]: mainHandler.bind_(null, 0, "roomDescript"),

        //[0x821e3cf0 - 0x80004000]: mainHandler.bind_(null, 0, "dateDescript"),

        //[0x8208b180 - 0x80004000]: mainHandler.bind_(null, 0, "MIYOMEMO"),

        [0x8208b180 - 0x80004000]: dialogueHandler.bind_(null, 0, "characterDesc1"),
        [0x8208b308 - 0x80004000]: dialogueHandler.bind_(null, 0, "characterDesc2"),
        [0x8208b360 - 0x80004000]: dialogueHandler.bind_(null, 0, "characterDesc3"),
        [0x8208b3b0 - 0x80004000]: dialogueHandler.bind_(null, 0, "characterDesc4"),

        [0x822c6534 - 0x80004000]: dialogueHandler.bind_(null, 3, "news_title"),
        [0x822c65ac - 0x80004000]: dialogueHandler.bind_(null, 3, "news_body"),
        [0x822c7bb0 - 0x80004000]: dialogueHandler.bind_(null, 0, "movies_title"),
        [0x822c83d4 - 0x80004000]: dialogueHandler.bind_(null, 0, "event_hall_title"),
        //[0x822c83d4 - 0x80004000]: dialogueHandler.bind_(null, 0, "eventhallBODY"),
        [0x820ec80c - 0x80004000]: dialogueHandler.bind_(null, 0, "help"),
        [0x822cfe28 - 0x80004000]: dialogueHandler.bind_(null, 0, "mail_title"),
        [0x822cf4d4 - 0x80004000]: dialogueHandler.bind_(null, 0, "mail_body"),
        [0x81f3084c - 0x80004000]: dialogueHandler.bind_(null, 0, "back_to_room"),
        [0x81f32a40 - 0x80004000]: dialogueHandler.bind_(null, 0, "phone"),

        [0x822153cc - 0x80004000]: dialogueHandler.bind_(null, 0, "clothes"),
        [0x8221573c - 0x80004000]: dialogueHandler.bind_(null, 0, "colour"),
        [0x82215584 - 0x80004000]: dialogueHandler.bind_(null, 0, "accessory"),

    }

}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
    const reg = regs[index];
    const address = reg.value;
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/[\s]/g, '');
    s = s.replace(/\\n/g, '');

    return s;
}