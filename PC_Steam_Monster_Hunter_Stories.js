// ==UserScript==
// @name         Monster Hunter Stories
// @version      1.1.1
// @author       [Carl-Lw]
// @description  Steam
// * developer	 CAPCOM Co., Ltd.
// * publisher   CAPCOM Co., Ltd.
//
// https://store.steampowered.com/app/2356560/Monster_Hunter_Stories/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

console.warn(`
Known issues:
- No text for menus, items and pop-ups.
`);

(function () {
    attach('CutsceneDialogueHook', 'E8 F4 F8 FF FF', 'rdx');
    attach('AlternateCutsceneDialogueHook', 'E8 DD D4 FF FF', 'rdx');
    attach('SubtitleHook', 'E8 4C FA FF FF', 'rdx');
    attach('DialogueHook', 'E8 27 B7 DC FF', 'rax');

    function filterText(s) {
        if (!s) return '';

        return s
            // game control codes
            .replace(/^`(.+?)@/, '$1')
            .replace(/\$K\d+(.*?)\$K\d+/g, '$1')
            .replace(/\$[Vv]\(#\d+\)/g, '___')

            // tags
            .replace(/<RT>[\s\S]*?<\/RT>/gi, '')
            .replace(/<\/?(?:RUBY|RB)>/gi, '')
            .replace(/<COL[^>]*>|<\/COL>/gi, '')
            .replace(/<SPN[^>]*>/gi, '')
            .replace(/<[^>]+>/g, '')

            // whitespace
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook ${address}`);

        Interceptor.attach(address, function () {
            const raw = this.context[register].readUtf8String();
            const text = filterText(raw);

            handler(text);
        });
    }
})();