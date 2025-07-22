// ==UserScript==
// @name         Mahou Shoujo no Majo Saiban
// @version      
// @author       emilybrooks
// @description  Steam
// * Acacia
// * Unity (JIT)
//
// https://store.steampowered.com/app/3101040/
// ==/UserScript==
const Mono = require('./libMono.js');

Mono.setHook('Elringus.Naninovel.Runtime', 'Naninovel.UI.RevealableText', 'SetTextValue', 1, {
    onEnter(args) {
        let text = args[1].readMonoString();
        text = text.replace(/<.*?>/g, ''); // remove control codes
        trans.send(text);
    }
});
