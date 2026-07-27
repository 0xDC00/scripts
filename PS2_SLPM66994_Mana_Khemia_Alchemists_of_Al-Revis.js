// ==UserScript==
// @name         [SLPM66994] Mana Khemia: Alchemists of Al-Revis / マナケミア～学園の錬金術士たち～
// @version      0.1
// @author       Mansive
// @description  PCSX2 x64
// ==/UserScript==

const { setHookEE, asPsxPtr } = require("./libPCSX2.js");

const handler = trans.send(dialogueHandler, "200+");

setHookEE({
    0x13cf84: handler.bind_(null, "a0", "dialogue"),
    0x42560c: handler.bind_(null, "v0", "item description")
});

function dialogueHandler(args, regs, hookname) {
    console.log("onEnter:", hookname);
    let s = this.context[regs](asPsxPtr).readShiftJisString();

    // console.warn(JSON.stringify(s));

    s = s
        .replace(/CR/g, "") // single line
        .replace(/CL\w{2}/g, ""); // 「CLREフィロCLNR」が仲間になりました。

    return s;
}
