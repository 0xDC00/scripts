// ==UserScript==
// @name         Inverted Angel
// @version      0.1
// @author       aqui
// @description  Steam
// * SCIKA
// * Unity (JIT)
//
// https://store.steampowered.com/app/2894960/Inverted_Angel/
// ==/UserScript==
console.log(`
Known bug: If you quit the game without detaching game get stuck so
Please detach before quitting the game
`)
const Mono = require('./libMono.js');
const {
    _module
} = Mono;
const handlerLine = trans.send((s) => s, '250+');

let lastDialogue = ""

Mono.setHook('Utage', 'Utage.AdvMessageWindowManager', 'OnPageTextChange', 1, {
    onEnter: function (args) {
        console.log('onEnter: Utage Utage.AdvMessageWindowManager:OnPageTextChange');
        let page = args[1].wrap()
        let name = page.NameText.readMonoString()
        let text = page.TextData.wrap().OriginalText.readMonoString()
        handlerLine(`${name}${name ? '\r\n' : ''}${text}`)
    },
});


Mono.setHook('', 'EffectController', 'ShowDialogue', -1, {
    onEnter(args) {
        console.log('onEnter: EffectController:ShowDialogue');
        const text = args[1].readMonoString();
        if (text !== lastDialogue) {
            lastDialogue = text
            handlerLine(text)
        }
    }
});

Mono.setHook('', 'PhoneController', 'OnGenerateChat', -1, {
    onEnter(args) {
        console.log('onEnter: PhoneController:OnGenerateChat');
        const message = args[1].readMonoString();
        const sender = args[2].readMonoString();
        handlerLine(`${sender}: ${message}`)
    }
});