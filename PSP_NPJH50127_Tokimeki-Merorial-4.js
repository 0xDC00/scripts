// ==UserScript==
// @name         [NPJH50127] Tokimeki Memorial 4
// @version      0.1
// @author       [Levanphoenix]
// @description  PPSSPP x64
// * 
// * 
// KnownIssues: character names not shown,only last choise gets captured, menu item descriptions not captured.
// Not Tested: doki doki mode.
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

setHook({
    0x899a510: trans.send(MailHandler, 400), // mail
    0x88719dc: trans.send(MainHandler, 400) // main handler
});

function MainHandler(regs) {

    let address = regs[1].value;
    let s = address.readShiftJisString();
    //console.log("Main handler");

    //remove weird text when choosing an ability
    let cleanedText = s.replace(/^�.*$|e_voice/g, '');
    return cleanedText;
}

function MailHandler(regs) {

    let address = regs[2].value;
    let s = address.readShiftJisString();
    //console.log("Mail handler");
    let fixedText = s.replace(/\\n/g, '\n');
    return fixedText;
}