// ==UserScript==
// @name         Uso kara Hajimaru Koi no Natsu
// @version      
// @author       emilybrooks
// @description  Steam
// * LYCORIS
// * Unity (JIT)
//
// https://store.steampowered.com/app/1575980/
// ==/UserScript==
const Mono = require('./libMono.js');

function cleanText(s) {
    return s
    .replace(/<size=0>.*?<\/size>/g, '')
    .replace(/<size=0>.*?<\/size5>/g, '') //typo in chapter 15
    .replace(/<.*?>/g, '');
}

let lastMessage = '';

Mono.setHook('Elringus.Naninovel.Runtime', 'Naninovel.UI.RevealableText', 'SetText', 1, {
    onEnter(args) {
        let text = args[1].readMonoString();
        if (text == lastMessage)
        {
            lastMessage = ''
            return
        }
        else
        {
            lastMessage = text;
            text = cleanText(text);
            trans.send(text);
        }
    }
});
