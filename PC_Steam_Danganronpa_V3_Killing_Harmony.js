// ==UserScript==
// @name         Danganronpa V3: Killing Harmony
// @version      1.0.2.0
// @author       [blacktide082] / Musi
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/567640/Danganronpa_V3_Killing_Harmony/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '100+');

(function () {
    attach('DialoguePattern', 'E8 BB?????? 48 ?? ?? ?? ?? 48 ?? ?? E8 7E?????? 0F28 ?? ?? ?? 48 ?? ?? ?? 5B', 'rcx', 0);
    attach('TrialDialogue', '48 8D 8B 6A 09 00 00 E8 ?? ?? ?? ?? 48 8B 4C 24', 'rcx', 7);
    
    function attach(name, pattern, register, offset) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        
        // log match count
        if (results.length === 1) {
            console.log(`[${name}] Pattern matched uniquely`);
        } else {
            console.warn(`[${name}] Pattern matched ${results.length} times`);
        }
        
        const address = results[0].address.add(offset);
        console.log(`[${name}] Found hook at ${address}`);
        
        let timeout = 0;
        
        Interceptor.attach(address, function () {
            const text = this.context[register].readUtf16String()
                .split('\n')
                .map(line => line.trim())
                .join('')
                .replace(/\s+/, '') // remove whitespace
                .replace(/<PAD=【(.+)】>/g, '（$1）') // reformat button glyphs
                .replace(/<[^>]+>/g, ''); // remove remaining <> tags
            
            clearTimeout(timeout);
            timeout = setTimeout(() => handler(text), 100);
        });
    }
})();
