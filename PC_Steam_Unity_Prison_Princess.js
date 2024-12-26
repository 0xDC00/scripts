// ==UserScript==
// @name         Prison Princess
// @version      1.0
// @author       Koukdw
// @description  Steam
// @developer & publisher: qureate
//
// https://store.steampowered.com/app/1151740/Prison_Princess/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send(s => s, '200+');


const MessageWindowController_SetText = Mono.use('', 'Atup.MessageWindowController').SetText;
Mono.setHook('', 'Atup.NovelUIController', 'PlayMessage', -1, {
    onEnter(args) {
        const isSkip = args[4] == 1;
        if(isSkip) return null;
        const hook_setup = MessageWindowController_SetText.attach({
            onEnter(args) {
                const isSetName = args[0].wrap().isSetName.value;
                const currentName = args[0].wrap().CurrentName.readMonoString();
                let text = isSetName ? currentName + "\r\n" + args[2].readMonoString() : args[2].readMonoString();
                text = cleanText(text);
                handler(text);
            },
            onLeave(ret) {
                hook_setup.detach()
            }
        })
    }
})

// Mono.setHook('', 'Atup.MessageWindowController', 'SetText', -1, {
//     onEnter(args) {
//         console.warn(args[2].readMonoString());
//     }
// })

function cleanText(s) {
    return s
        .replace(/<ruby=[^>]*>/g, '') // Remove opening ruby tags
        .replace(/<\/ruby>/g, '') // Remove closing ruby tags
        .replace(/<color=[^>]*>/g, '') // Remove opening <color=...> tags
        .replace(/<\/color>/g, '')
}
