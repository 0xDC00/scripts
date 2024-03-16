// ==UserScript==
// @name         Muv-Luv (マブラヴ)
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * aNCHOR Inc.
//
// https://store.steampowered.com/app/802880/MuvLuv/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');

(function () {
    var dialogSig = '8B ?? ?? 8D ?? ?? 89 ?? ?? 0FB7 ?? 8D ?? ?? 85 ?? 0F84 ???????? 83';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0xC);
    console.log('[DialoguePattern] Found hook', address);

    Interceptor.attach(address, function (args) {
        const text = this.context.eax.readUtf16String()
            .replaceAll('\u0001', '') // remove unicode Start of Text characters
            .replaceAll('\u0003', '') // remove unicode End of Text characters
            .replaceAll('\n', '')
            .trim();

        // skip blank lines
        if (text === '') return;

        handler(text);
    });
})();
