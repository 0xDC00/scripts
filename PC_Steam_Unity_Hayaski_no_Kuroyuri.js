// ==UserScript==
// @name         Hayasaki no Kuroyuri
// @version      
// @author       emilybrooks
// @description  Steam
// * 1000-REKA
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/1931940/
// ==/UserScript==
const Mono = require('./libMono.js');

Mono.setHook('', 'AdvText', 'SetText', 6, {
    onEnter(args) {
        let text = args[3].readMonoString().replace(/\s+|#Keyword.*?]|#End/g, '');
        trans.send(text);
    }
});
