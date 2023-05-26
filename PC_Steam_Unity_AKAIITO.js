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

// backlog (sometimes has extra text for section headers)
// Mono.setHook('', 'messageLog', 'AddLog', 2, {
//     onEnter(args) {
//         let name = args[1].readMonoString();
//         let text = args[2].readMonoString();
//         text = text.replace(/<\/?[^>]*./g, '');
//         trans.send(text);
//     }
// });

// text box
Mono.setHook('', 'messageController', 'showMessageCor', 2, {
    onEnter(args) {
        let text = args[1].readMonoString();
        text = text.replace(/<\/?[^>]*./g, '');
        trans.send(text);
    }
});
