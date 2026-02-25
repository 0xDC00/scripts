// ==UserScript==
// @name         Suikoden I&II HD Remaster Gate Rune and Dunan Unification Wars
// @version      1.0.4
// @author       Musi
// @description  Steam
// * KONAMI
//
// https://store.steampowered.com/app/1932640/Suikoden_III_HD_Remaster_Gate_Rune_and_Dunan_Unification_Wars/
// ==/UserScript==

const Mono = require('./libMono.js');
const handleLine = trans.send((s) => s, '250+');

console.warn('[Known issue] You may have to detach from the game manually when exiting, otherwise it might not close.\n');

// cache unity methods for performance
let get_gameObject, get_name;

let currentLines = {};
let flushTimer = null;
const FLUSH_DELAY = 250; // this was tested with dialogue set to fast, adjust as necessary

Mono.perform(() => {
    const UnityObject = Mono.use('UnityEngine', 'UnityEngine.Object');
    get_name = UnityObject.get_name;

    const UnityComponent = Mono.use('UnityEngine', 'UnityEngine.Component');
    get_gameObject = UnityComponent.get_gameObject;
	
    Mono.setHook('Unity.TextMeshPro', 'TMPro.TextMeshProUGUI', 'set_text', -1, {
        onEnter(args) {
            // return early if pointer is null
            const tmproPtr = args[0];
            const textPtr = args[1];
            if (!textPtr || textPtr.isNull()) return;

            // get unity object name to filter dialogue lines
            const gameObject = get_gameObject.call(tmproPtr);
            const name = get_name.call(gameObject).readMonoString();

            // whitelist dialogue objects
            if (!name.startsWith('Txt_Command0')) return;

            let update = textPtr.readMonoString();
            if (!update) return;

            // map text to its specific object name to handle multi-line windows
            currentLines[name] = update;

            // remove alignment tags
            clearTimeout(flushTimer);
            flushTimer = setTimeout(() => {
                // combine lines 1, 2, and 3 in order
                let fullText = Object.keys(currentLines).sort().map(k => currentLines[k]).join('\n');
                let cleanOutput = fullText.replace(/<[^>]*>/g, '').trim();
                
                if (cleanOutput.length > 0) {
                    handleLine(cleanOutput);
                }
                
                currentLines = {};
            }, FLUSH_DELAY);
        }
    });
});
