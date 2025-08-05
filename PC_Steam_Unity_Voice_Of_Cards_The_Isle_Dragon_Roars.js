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

// General hook for all text. Works but it's spammy
const TMP_Text = Mono.use('Unity.TextMeshPro', 'TMPro.TextMeshProUGUI'); // TextMeshProUGUI TMP_Text
TMP_Text.set_text.attach({
    onEnter(args) {
        const s = args[1].readMonoString()
            .replace(/(<.*?>)+/g, '');;

        const excluded = [
            '', 'LOADING', 'Autosaving...', 'Speed Changed', 'アイテム', 'スキル'
        ];
        if (excluded.includes(s)) return;
        if (/\d+/.test(s)) return;

        handler(s);
    }
});

// Main menu and submenus
Mono.setHook('', 'CardAnalogica.TopMenuCard', 'Highlight', 0, {
    onEnter(args) {
        /** @type {Mono.MonoObjectWrapper} */
        const card = args[0].wrap();
        const frontText = card.frontText.getValue().wrap().text.readMonoString();
        handler(frontText);
    }
});