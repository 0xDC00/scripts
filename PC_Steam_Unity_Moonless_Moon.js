// ==UserScript==
// @name         Moonless Moon
// @version      
// @author       T4uburn
// @description  Steam
// * Kazuhide Oka
// * Unity (il2cpp)
//
// https://store.steampowered.com/app/2951340/Moonless_Moon/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send((s) => s, '250+');

/*
    Prints most text for general dialogue and riddle sequences.
*/

// General text, triggers once per printed line.
Mono.setHook('', 'app.TextElementController/Text', 'setText', -1, {
    onEnter(args) {
        handler(args[1].readMonoString().replace(/<[^>]*>/g, ''))
    }
});

// Some tutorials and additional alert messages.
Mono.setHook('', 'app.Dialog', 'init', -1, {
    onEnter(args) {
        handler(args[0].readMonoString().replace(/<[^>]*>/g, ''))
    }
});

// Some explanations / hints.
Mono.setHook('', 'app.Dialog', 'open', 1, {
    onEnter(args) {
        handler(args[0].readMonoString().replace(/<[^>]*>/g, ''))
    }
});

// Mono.setHook('', 'app.TextSegmenterSuppotor', 'getLines', -1, {
//     onEnter(args) {
//         handler(args[0].readMonoString())
//     }
// });