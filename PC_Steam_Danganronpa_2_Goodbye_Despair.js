// ==UserScript==
// @name         Danganronpa 2: Goodbye Despair
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/413420/Danganronpa_2_Goodbye_Despair/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200++'); // join lines

(function () {
    const dialogSig = '66 ?? ?? C1 ?? ?? 03 ?? 66 ?? ?? ?? ???????? 80 ?? ?? 75 ?? 8A ?? ?? 80';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    let text = '';
    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        const value = this.context.esi.readUtf16String()
            .replace(/<CLT.*?>/g, '')
            .replaceAll('\n', '')
            .trim();
        if (!text.endsWith(value)) {
            text = value;
            handler(text);
        }
    });
})();
