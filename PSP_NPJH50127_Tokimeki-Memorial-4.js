// ==UserScript==
// @name         [NPJH50127] Tokimeki Memorial 4
// @version      0.1
// @author       Levanphoenix
// @description  PPSSPP x64
// * 
// * 
// KnownIssues: menu item descriptions not captured.
// Not Tested: doki doki mode.
// ==/UserScript==
const { setHook } = require("./libPPSSPP.js");

const mainHandler = trans.send(MainHandler, -200);
const mailHandler = trans.send(MailHandler, -200);
const choicesHandler = trans.send(ChoicesHandler, '400+');

setHook({
    0x899a510: mailHandler.bind_(null,2,"mail"), // mail
    0x88719dc: mainHandler.bind_(null,1,"text"), // text handler(no choices)
    0x8850270: choicesHandler.bind_(null,1,"choices"), // text(no names,no tutorial texts) + choices
});

function ChoicesHandler(regs, index, hookname) {

    let address = regs[index].value;
    let s = address.readShiftJisString();
    
    //if sentence ends with punctuations assume it's not a choice
    let doesNotEndWithPunctuation = /[^…。！？]$/.test(s);
    if (doesNotEndWithPunctuation)
        return s;
}

function MainHandler(regs, index, hookname) {

    let address = regs[index].value;
    let s = address.readShiftJisString();
    //console.log("Main handler");

    //remove weird text when choosing an ability
    let cleanedText = s.replace(/^�.*$|e_voice/g, '');
    return cleanedText;
}

function MailHandler(regs, index, hookname) {

    let address = regs[index].value;
    let s = address.readShiftJisString();
    //console.log("Mail handler");
    let fixedText = s.replace(/\\n/g, '\n');
    return fixedText;
}
