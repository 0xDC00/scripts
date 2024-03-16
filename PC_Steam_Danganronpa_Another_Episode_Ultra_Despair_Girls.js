// ==UserScript==
// @name         Danganronpa Another Episode: Ultra Despair Girls
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/555950/Danganronpa_Another_Episode_Ultra_Despair_Girls/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '100+');

(function () {
    const dialogSig = '66 ?? ?? ?? ?? 8B ?? ???????? 01 ?? ???????? 0F?? ?? ?? ?? EB';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);

    let timeout = 0;
    let previous = ' ';
    Interceptor.attach(address, function (args) {
        const text = args[3].readUtf16String()
            .replace(/#[Rl][0-9]+[#\.]{0,2}/g, '')
            .replace(/\s+/g, '');
        if (previous.startsWith(text)) return;
        previous = text;
        clearTimeout(timeout);
        timeout = setTimeout(() => handler(text), 100);
    });
})();
