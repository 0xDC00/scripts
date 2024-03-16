// ==UserScript==
// @name         Aokana - Four Rhythms Across the Blue
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * sprite, NekoNyan Ltd.
// * Unity (JIT)
//
// https://store.steampowered.com/app/1044620/Aokana__Four_Rhythms_Across_the_Blue/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send(s => s, '200+');

// Language output can be changed here (see options below).
// 0 = English, 1 = Japanese, 2 = Simplified Chinese, 3 = Traditional Chinese
// For example, [1, 0] will output Japanese, then English.
const outputs = [1];

Mono.setHook('', 'ScriptAokana', 'DoText', 2, {
    onEnter(args) {
        const dialogues = args[1]
            .readMonoString()
            .split('\u2402') // U+2402 Start of Unicode Character
            .splice(1) // Skip the first (it's always blank)
            .map(t => t.trim().replace(/<.*?>/g, '').split('：')) // Remove HTML tags
            .map(s => s[s.length - 1]); // Remove character's name

        if (dialogues.length !== 4) {
            console.warn("Unexpected dialogue length, expected 4 but got ", dialogues.length);
            return;
        }

        outputs.map(o => dialogues[o]).forEach(handler);
    }
});
