// ==UserScript==
// @name         Little Busters! English Edition
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * KEY
//
// https://store.steampowered.com/app/635940/Little_Busters_English_Edition/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

console.warn(`
Known issues:
- Some dialogues during fights don't include the damage in the log, for example: 真人に___のダメージ！
`);

(function () {
    attach('DialogueHook', '89 ?? ?? ???????? 46 83 ?? ?? 7C ?? 8D ?? ???????? 8B', 'eax');
    attach('FightingHook', '83 ?? ?? 66 ?? ?? 75 ?? 2B ?? 83 ?? ?? 66 ?? ?? ?? 83', 'edx');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook ${address}`);
        Interceptor.attach(address, function (args) {
            const text = this.context[register]
                .readUtf16String()
                // Fix the speaker's name on spoken dialogue, `鈴@ => 鈴 
                .replace(/^`(.+?)@/, '$1')
                // Remove the "link" formatting, e.g. $K90<text>$K0
                .replace(/\$K\d+(.*?)\$K\d+/g, '$1')
                // Remove the control codes from some fight dialogues, e.g. $V(#20002)
                .replace(/\$[Vv]{1}\(#\d+\)/g, '___')
                .replace(/\s+/g, '');
            handler(text);
        });
    }
})();
