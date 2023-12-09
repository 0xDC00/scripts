// ==UserScript==
// @name         AKAIITO
// @version      
// @author       emilybrooks
// @description  Steam
// * SUCCESS Corp.	
// * Unity (JIT)
//
// https://store.steampowered.com/app/2097740/AKAIITO_HD_REMASTER/
// ==/UserScript==
const Mono = require('./libMono.js');
const {
    setHook
} = Mono;

function cleanText(s) {
    return s
        .replace(/\s+/g, '') //remove whitespace
        .replace(/<\/?[^>]*./g, ''); //remove control codes
}

// backlog (sometimes has extra text for section headers)
// Mono.setHook('', 'messageLog', 'AddLog', 2, {
//     onEnter(args) {
//         let name = args[1].readMonoString();
//         let text = args[2].readMonoString();
//         text = cleanText(text);
//         trans.send(text);
//     }
// });

//text box
Mono.setHook('', 'messageController', 'showMessageCor', 2, {
    onEnter(args) {
        let text = args[1].readMonoString();
        text = cleanText(text);
        //don't grab the test message from the options menu
        if (text != "文章中ではこのように表示される") {
            trans.send(text);
        }
    }
});

//dictionary
Mono.setHook('', 'KeywordData', 'getKeywordDataOne', 2, {
    onLeave(retVal) {
        let word = retVal.wrap().showName.value;
        let reading = retVal.wrap().readName.value;
        let definition = retVal.wrap().contentText.value;
        definition = cleanText(definition);
        let output = word + '\r\n' + reading + '\r\n' + definition;
        trans.send(output);
    }
});

//dialog choices
Mono.setHook('', 'selectDialogControl', 'showDailog', 1, {
    onEnter(args) {
        let text = args[1].wrap().message.value;
        text = text.replace(/\t+/g, ''); //remove whitespace, but keep newline
        trans.send(text);
    }
});

