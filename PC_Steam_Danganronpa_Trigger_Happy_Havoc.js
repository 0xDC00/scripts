// ==UserScript==
// @name         Danganronpa: Trigger Happy Havoc
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/413410/Danganronpa_Trigger_Happy_Havoc/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');

(function () {
    const dialogSig = '89 ?? ?? 89 ?? ?? 8D ?? ?? ???????? 0FB7 ?? 83 ?? ?? 75 ?? 8B';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    let text = '';
    const address = results[0].address.add(0xD);
    console.log('[DialoguePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        const value = this.context.ecx.readUtf16String()
            .replace(/<CLT\s?\d*?>/g, '')
            .replaceAll('\n', '')
            .trim();
        if (!text.endsWith(value)) {
            text = value;
            handler(text);
        }
    });
})();
