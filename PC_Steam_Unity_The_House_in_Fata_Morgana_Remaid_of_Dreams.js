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

console.warn('[Known Issue] You may have to detach from the game manually when exiting, otherwise it might not close.');

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

function cleanText(text) {
    return text
        .replace(/<color=#[0-9a-fA-F]+>/g, '')
        .replace(/<\/color>/g, '')
        .replace(/<align="[^"]*">/g, '')
        .replace(/<\/align>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\r?\n/g, '')
        .trim();
}

function hasJapaneseText(text) {
    return /[\u3040-\u30FF\u4E00-\u9FAF]/.test(text);
}

let lastText = '';

Mono.setHook('Unity.TextMeshPro', 'TMPro.TextMeshProUGUI', 'set_text', 1, {
    onEnter(args) {
        // only allow text if the caller is GenerateNewText, this is unique to dialogue 
        const methodName = getMethodName(this.returnAddress);
        if (methodName !== "GenerateNewText") {
            return;
        }

        const basePtr = args[1];
        
        // early return if pointer is null
        if (!basePtr || basePtr.isNull()) {
            return;
        }
        
        const text = basePtr.readMonoString();
        
        // early return if no text or too short
        if (!text || text.length <= 2) {
            return;
        }
        
        // early return if no Japanese text
        if (!hasJapaneseText(text)) {
            return;
        }
        
        const cleaned = cleanText(text);
        
        // early return if cleaned text is too short
        if (!cleaned || cleaned.length <= 6) {
            return;
        }
        
        // this is so lines are not repeated but new lines of the same textbox are output separately
        if (cleaned.startsWith(lastText) && cleaned.length > lastText.length) {
            const newPart = cleaned.substring(lastText.length).trim();
            lastText = cleaned;
            handleLine(newPart);
        } else if (!cleaned.startsWith(lastText)) {
            lastText = cleaned;
            handleLine(cleaned);
        }
    }
});
