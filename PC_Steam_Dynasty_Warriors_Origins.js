// ==UserScript==
// @name         DYNASTY WARRIORS: ORIGINS
// @version      1.0.1.1
// @author       Musi
// @description  Steam
// * KOEI TECMO GAMES CO., LTD. 
//
// https://store.steampowered.com/app/2384580/DYNASTY_WARRIORS_ORIGINS/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

console.warn('[Known Issue] When opening the log in game, the line at the top is output.');
console.warn('[Known Issue] On choices, only the first option is output, this is a limit of the DialogueHook');

(function () {
    attach('FullscreenMovieText', 'E8 22 8A 1A 00', 'rdx');
    attach('FullscreenText', 'E8 F8 7A 2A 00', 'rdx');
    attach('BattleTextboxDialogue', 'E8 80 83 1A 00', 'rdx');
    attach('BattleDialogue', 'E8 F7 F9 6F 00', 'rdx');
    attach('MovieDialogue', 'E8 D1 A5 D9 00', 'rdx');
    attach('TutorialHook', 'E8 D7 90 40 00', 'rdx');
    attach('DialogueHook', 'E8 26 89 40 00', 'rdx');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook at ${address}`);

        let previous = '';

        Interceptor.attach(address, {
            onEnter: function (args) {
                try {
                    const ptr = this.context[register];
                    if (ptr.isNull()) return;

                    const rawText = ptr.readUtf8String();
                    if (!rawText) return;

                    const cleanedText = rawText
                        .replace(/\[p\]/g, '無名') // replace protag name
                        .replace(/\[ft\].*?\[fe\]/g, '')
                        .replace(/\[fs\]|\[\/\]/g, '')
                        .replace(/\[\$.*?\]/g, '')
                        .replace(/\[c\d+\]/g, '')
                        .trim();

                    if (cleanedText && cleanedText !== previous) {
                        console.log(`[DEBUG] Triggered: ${name}`);
                        previous = cleanedText;
                        handler(cleanedText);
                    }
                } catch (e) {
                }
            }
        });
    }
})();
