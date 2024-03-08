// ==UserScript==
// @name         WITCH ON THE HOLY NIGHT
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * TYPE MOON
// * tested on ver1.1
//
// https://store.steampowered.com/app/2052410/WITCH_ON_THE_HOLY_NIGHT/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');

(function () {
    const dialogSig = '48 ?? ?? ?? ?? 48 ?? ?? ?? 48 ?? ?? ?? ???????? 33 C0 48 ?? ?? 10 48 ?? ?? 18 ???????? 66';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // skip if not dialogue
        if (args[3] != 1) return;
        const text = args[2].readUtf16String()
            .replace(/<r.*?>(.*?)<\/r>/g, "$1") // remove furigana
            .split('\n')
            .map(s => s.trim())
            .join('');
        handler(text);
    });
})();
