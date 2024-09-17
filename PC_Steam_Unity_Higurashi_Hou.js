// ==UserScript==
// @name         Higurashi When They Cry Hou
// @version      
// @author       samheiden
// @description  Steam
// * 07th Expansion
// * MangaGamer
// * Unity (JIT)
//
// https://store.steampowered.com/app/310360/Higurashi_When_They_Cry_Hou__Ch1_Onikakushi/
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

Mono.setHook('', 'Assets.Scripts.Core.TextWindow.TextController', 'SetText', 4, {
    onEnter(args) {
	if (args[4] == 2) return;
        let text = args[2].readMonoString();
        text = cleanText(text);
        trans.send(text);
    }
});
