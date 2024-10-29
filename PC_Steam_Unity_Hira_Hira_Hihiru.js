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

const { setHook, findClass } = require('./libMono.js');

const handler = trans.send((s) => s, 500); 

const TextDataClass = findClass('', 'Utage.TextData');
const makeLogTextMethod = TextDataClass.findMethod('MakeLogText', -1);

function removeFurigana(text) {
    return text
        .replace(/<ruby=[^>]*>([^<]*)<\/ruby>/g, '$1');
}

function isTextDump(text) {
    return text.includes('\n');
}

if (makeLogTextMethod !== null) {
    setHook(makeLogTextMethod, {
        onEnter: function(args) {
            const rawText = args[0].readMonoString();
            const cleanedText = removeFurigana(rawText);

            if (cleanedText && !isTextDump(cleanedText)) {
                this.cleanedText = cleanedText;
            }
        },
        onLeave: function() {
            if (this.cleanedText) {
                handler(this.cleanedText);
            }
        }
    });
} else {
    console.error('Method MakeLogText not found in Utage.TextData');
}