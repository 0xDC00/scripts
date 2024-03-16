// ==UserScript==
// @name         CHRONO TRIGGER
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Square Enix
//
// https://store.steampowered.com/app/613830/CHRONO_TRIGGER/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '100+');

(function () {
    const pattern = '55 8B ?? 8B ?? ?? 53 8B ?? ?? 56 8B ?? C7';
    const results = Memory.scanSync(__e.base, __e.size, pattern);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        const text = this.context.eax.readUtf8String()
            .replaceAll('\\', '')
            .replace(/\s+/g, '')
            .replace(/<C[0-9]>.+?<\/C[0-9]>/g, '')
            .replaceAll('<CT>', '')
            .replaceAll('<PAGE>', '\n');
        handler(text);
    });
})();
