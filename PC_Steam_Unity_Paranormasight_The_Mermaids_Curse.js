// ==UserScript==
// @name         PARANORMASIGHT: The Mermaid's Curse
// @version      1.0.0.0
// @author       Musi
// @description  Steam
// * Square Enix
// * Unity (Mono)
//
// https://store.steampowered.com/app/2701440/PARANORMASIGHT_The_Mermaids_Curse/
// ==/UserScript==

const Mono = require('./libMono.js');
const handlerLine = trans.send((s) => s, '200+');

Mono.setHook('', 'Misty.WindowMessage', 'SetTextParam', -1, {
    onEnter(args) {
        try {
            const s = args[1].readMonoString();
            const clean = s.replace(/\*[\s\u3000]*\*[\s\u3000]*\*/g, '\n').replace(/<[^>]*>|\[[^\]]*\]/g, '').trim(); // "*　　*　　*" appears in some tips and is always followed by a line break
            if (clean.length > 0) handlerLine(clean);
        } catch(e) {}
    }
});