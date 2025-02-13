// ==UserScript==
// @name         Urban Myth Dissolution Center
// @version      
// @author       tera8m4
// @description  Steam
// * Hakababunko
// * Unity (JIT)
//
// https://store.steampowered.com/app/2089600/Urban_Myth_Dissolution_Center/
// ==/UserScript==

const Mono = require('./libMono.js');
const {
    _module
} = Mono;

Mono.setHook('', 'AC.Speech', '.ctor', 8, {
    onEnter(args) {
        let text = args[2].readMonoString()
            // remove furigana
            .replace(/<r=[^>]*>([^<]*)<\/r>/g, '$1')
            // remove any remaining HTML tags
            .replace(/<.*?>/g, '');
        trans.send(text);
    }
});