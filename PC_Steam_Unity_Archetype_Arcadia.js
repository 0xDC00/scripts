// ==UserScript==
// @name         Archetype Arcadia
// @version      0.1
// @author       [Carl-Lw]
// @description  Steam
// * Water Phoenix. KEMCO
// * Unity (Mono)
//
// https://store.steampowered.com/app/1768400/Archetype_Arcadia/
// ==/UserScript==

const Mono = require("./libMono.js");

const handler = trans.send((s) => s, "200+");
const cleanText = (s) =>
    s.replace(/・/g, "");

let buffer = "";
let timer = null;

Mono.setHook("UnityEngine.TextRenderingModule", "UnityEngine.TextMesh", "set_text", 1, {
    onEnter(args) {
        try {
            const text = args[1].readMonoString();
            if (!text) return;

            buffer = text.length === 1 ? buffer + text : text;

            if (timer !== null) clearTimeout(timer);

            timer = setTimeout(() => {
                if (buffer) handler(cleanText(buffer));
                buffer = "";
                timer = null;
            }, 500);
        } catch (e) {
            console.log("[TextMesh] " + e);
        }
    },
});



