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
    attach('DialoguePattern', '55 8B ?? 8B ?? ?? 53 8B ?? ?? 56 8B ?? C7', 'eax');
    attach('SkillMenu', '42 6A ?? E8 ?? ?? ?? ?? 83 C4 04 C7 45 ?? 0F 00 00 00 C7 45 ?? 00 00 00 00 C6 45 ?? ?? 85 DB 74 ?? 8B 95', 'ecx');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }

        console.log(`[${name}] Found ${results.length} matches`);

        const address = results[0].address;
        console.log(`[${name}] Found hook`, address);
        Interceptor.attach(address, function (args) {
            const text = this.context[register].readUtf8String()
                .replaceAll('\\', '')
                .replace(/\s+/g, '')
                .replace(/<C[0-9]>.+?<\/C[0-9]>/g, '')
                .replaceAll('<CT>', '')
                .replaceAll('<PAGE>', '\n');
            handler(text);
        });
    }
})();





