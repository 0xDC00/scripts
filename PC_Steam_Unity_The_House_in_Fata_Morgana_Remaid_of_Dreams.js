// ==UserScript==
// @name         The House in Fata Morgana: Remaid of Dreams
// @version      4.11
// @author       Musi
// @description  Steam
// * NOVECT
// * Unity (Mono)
//
// https://store.steampowered.com/app/303310/The_House_in_Fata_Morgana/
// https://store.steampowered.com/app/804700/The_House_in_Fata_Morgana_A_Requiem_for_Innocence/
// https://store.steampowered.com/app/1909810/Seventh_Lair/
// https://www.fataremaid.com/
// ==/UserScript==

const Mono = require('./libMono.js');
const handleLine = trans.send((s) => s, '250+');

console.warn('[Known issue] You may have to detach from the game manually when exiting, otherwise it might not close.\n');

let lastText = '';

Mono.perform(() => {
    // direct hook dialogue
    Mono.setHook('', 'TextPutTMPro', 'GenerateNewText', -1, {
        onEnter(args) {
            const instance = args[0].wrap();
            
            // call the getter directly from the wrapped instance
            const basePtr = instance.get_OriginalMessage();
            
            if (!basePtr || basePtr.isNull()) {
                return;
            }
            
            let text = basePtr.readMonoString();

            // remove alignment tags
            text = text.replace(/<align="[^"]*">/g, '').replace(/<\/align>/g, '');

            if (text.endsWith('「')) {
                return;
            }
            
            // this is so lines are not repeated but new lines of the same textbox are output separately
            if (text.startsWith(lastText) && text.length > lastText.length) {
                const newPart = text.substring(lastText.length);
                lastText = text;
                handleLine(newPart);
            } else if (!text.startsWith(lastText)) {
                lastText = text;
                handleLine(text);
            }
        }
    });
});
