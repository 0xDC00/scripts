// ==UserScript==
// @name         AI: The Somnium Files
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
// * Unity (JIT)
//
// https://store.steampowered.com/app/948740/AI_The_Somnium_Files/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send(s => s, '200+');

Mono.setHook('', 'Game.TextController', 'SetNextLine', 1, {
    onEnter(args) {
        const text = args[1]
            .readMonoString()
            .split('\n')
            .map(t => t.trim())
            .join('')
            // handle button/keys
            .replace(/<sprite name=(.*?)>/g, '{$1}')
            // remove any remaining HTML tags
            .replace(/<.*?>/g, '');
        handler(text);
    }
});
