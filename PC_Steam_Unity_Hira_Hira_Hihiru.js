// ==UserScript==
// @name         Hira Hira Hihiru
// @version      
// @author       C-G
// @description  Steam
// * BA-KU
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/2314820/Hira_Hira_Hihiru/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send((s) => s, '200++'); 

function removeFurigana(text) {
    return text.replace(/<ruby=[^>]*>([^<]*)<\/ruby>/g, '$1');
}

function isTextDump(text) {
    return text.includes('\n'); 
}

Mono.setHook('', 'Utage.TextData', 'MakeLogText', -1, {
    onEnter(args) {
        const text = removeFurigana(args[0].readMonoString());
        if (text && text.trim()) {
            if (isTextDump(text)) {
                return; 
            }
            handler(text);
        }
    }
});

