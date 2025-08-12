// ==UserScript==
// @name         Voice of Cards: The Isle Dragon Roars
// @version      0.1
// @author       spongerobertosquarepantalones
// @description  Steam
// 
// https://store.steampowered.com/app/1113570/Voice_of_Cards_The_Isle_Dragon_Roars/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send(s => s, '200+');

console.warn('For now, all cards are translated at the start of a battle');

// General hook for all text. Works but it's spammy
const TMP_Text = Mono.use('Unity.TextMeshPro', 'TMPro.TextMeshProUGUI'); // TextMeshProUGUI TMP_Text
let lastAddress;
TMP_Text.set_text.attach({
    onEnter(args) {
        /** @type {NativePointer} */
        const address = args[1];
        if (address.isNull() || lastAddress?.equals(address)) return;
        lastAddress = address;
        const text = cleanText(address.readMonoString());
        if (shouldHandle(text)) {
            handler(text);
        }
    }
});

// Main menu and submenus: currently highlighted card
Mono.setHook('', 'CardAnalogica.TopMenuCard', 'Highlight', 0, {
    onEnter(args) {
        /** @type {Mono.MonoObjectWrapper} */
        const card = args[0].wrap();
        const frontText = card.frontText.getValue().wrap().text.readMonoString();
        handler(frontText);
    }
});


/**
 * Filter out stuff like standard controls (e.g. 'return') and damage numbers to reduce spam
 * @param {string} text 
 * @returns {boolean}
 */
function shouldHandle(text) {
    const excluded = [
        '', 'LOADING', 'Autosaving...', 'Speed Changed', 'アイテム', 'スキル', '戻る'
    ];
    if (excluded.includes(text) || /\d+/.test(text)) return false;
    return true;
}

/**
 * @param {string} text 
 * @returns {string}
 */
function cleanText(text) {
    return text
        .replace(/<.*?>+/g, '')
        .trim();
}