// ==UserScript==
// @name         The House in Fata Morgana
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

console.warn('[Known Issue] Some inner dialogue is picked up even when not displayed in game. Recommend ignoring this for spoiler reasons.');

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
    // check if text contains Japanese characters 
    return /[\u3040-\u30FF\u4E00-\u9FAF]/.test(text);
}

let lastText = '';

Mono.setHook('Unity.TextMeshPro', 'TMPro.TextMeshProUGUI', 'set_text', 1, {
    onEnter(args) {
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
        
        // this is so lines are not repeated but new lines of the same textbox are output seperately
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
