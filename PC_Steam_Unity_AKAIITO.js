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
        .replace(/\n+/g, '') // remove newline
        .replace(/<\/?[^>]*./g, ''); // remove control codes
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

// text box
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
