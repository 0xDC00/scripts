// ==UserScript==
// @name         Zero Escape: The Nonary Games - Virtue’s Last Reward
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/477740/Zero_Escape_The_Nonary_Games/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '100+');

(function () {
    // ze2.exe+A1B43 - 80 3B 00 - cmp byte ptr [ebx],00
    const dialogSig = '80 ?? ?? 74 ?? 8D ?? ?? 46 80 ?? ?? 75 ?? 8B ?? ?? 03';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);

    const skip = ['はい', 'いいえ'];
    Interceptor.attach(address, function (args) {
        const read = this.context.eax.readUtf8String();
        if (skip.includes(read) || !read.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]+/)) {
            return;
        }

        const text = read
            .split("<N>")
            .map(line => line.trim())
            .join('')
            .replace(/<[^>]+>/g, '')
            .trim();
        handler(text);
    });

    // Alternative hook. Works perfectly fine, but it only has dialogue (no menus, popups, etc.).
    // 01 77 08 5E 5F 5B 5D C2 04 00 CC
    // Interceptor.attach(address, function(args) {
    //     const read = this.context.ecx.readUtf8String();
    //     if (!read.endsWith("<K>") && !read.endsWith("<P>")) return;
    //     const text = read
    //         .replace(/<[^>]+>/g, '')
    //         .trim();
    //     handler(text);
    // });
})();
