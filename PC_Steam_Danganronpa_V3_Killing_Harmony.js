// ==UserScript==
// @name         Danganronpa V3: Killing Harmony
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/567640/Danganronpa_V3_Killing_Harmony/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '100+');

(function () {
    // Dangan3Win.exe+3596E0 - E8 BB2F3500
    const dialogSig = 'E8 BB?????? 48 ?? ?? ?? ?? 48 ?? ?? E8 7E?????? 0F28 ?? ?? ?? 48 ?? ?? ?? 5B';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);

    let timeout = 0;
    Interceptor.attach(address, function (args) {
        const text = args[0].readUtf16String()
            .split('\n')
            .map(line => line.trim())
            .join('')
            .replace(/\s+/, '') // remove whitespace
            .replace(/<PAD=【(.+)】>/g, '（$1）') // reformat button glyphs
            .replace(/<[^>]+>/g, ''); // remove remaining <> tags
        clearTimeout(timeout);
        timeout = setTimeout(() => handler(text), 100);
    });
})();
