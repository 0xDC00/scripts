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

console.warn('[known issues]\n');
console.warn('you may have to detach from the game manually when exiting, otherwise it might not close.\n');

// there might be a better way to do this with the libMono.js but i couldnt figure it out 
const mono = Process.getModuleByName("mono-2.0-bdwgc.dll");
const mono_domain_get = new NativeFunction(mono.findExportByName("mono_domain_get"), 'pointer', []);
const mono_jit_info_table_find = new NativeFunction(mono.findExportByName("mono_jit_info_table_find"), 'pointer', ['pointer', 'pointer']);
const mono_jit_info_get_method = new NativeFunction(mono.findExportByName("mono_jit_info_get_method"), 'pointer', ['pointer']);
const mono_method_get_name = new NativeFunction(mono.findExportByName("mono_method_get_name"), 'pointer', ['pointer']);

function getMethodName(returnAddr) {
    const domain = mono_domain_get();
    const jitInfo = mono_jit_info_table_find(domain, returnAddr);
    if (jitInfo.isNull()) return "";
    const method = mono_jit_info_get_method(jitInfo);
    return mono_method_get_name(method).readUtf8String();
}

let lastText = '';
let cachedGetter = null;

Mono.perform(() => {
    const targetClass = Mono.findClass('', 'TextPutTMPro');
    if (!targetClass) return;

    // cache the getter once to prevent debug output in console
    cachedGetter = targetClass.findMethod('get_OriginalMessage', 0);

    // direct hook dialogue
    Mono.setHook('', 'TextPutTMPro', 'GenerateNewText', -1, {
        onEnter(args) {
            if (!cachedGetter) return;

            // pull the text pointer by invoking the getter on the current instance
            const basePtr = cachedGetter.invoke(args[0]);
            
            if (!basePtr || basePtr.isNull()) {
                return;
            }
            
            let text = basePtr.readMonoString();
            
            // return if no text
            if (!text) {
                return;
            }

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
