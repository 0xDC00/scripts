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
    attach('FullscreenMovieText', 'E8 22 8A 1A 00', 'rdx', 0); // i wasnt able to find a robust hook that works across versions on this
    attach('FullscreenText', 'E8 F8 7A 2A 00', 'rdx', 0); // same here
    attach('BattleTextboxDialogue', '49 8B CA C6 44 24 20 01 E8 ?? ?? ?? ?? 48 83 C4 58', 'rdx', 8);
    attach('BattleDialogue', 'C6 44 24 20 00 41 B1 01 E8 ?? ?? ?? ?? 48 8B 4F 60', 'rdx', 8);
    attach('MovieDialogue', 'C6 44 24 28 01 C6 44 24 20 01 E8 ?? ?? ?? ?? 49 8B 8D 90', 'rdx', 10);
    attach('TutorialHook', '44 88 4C 24 20 41 B1 01 E8 ?? ?? ?? ?? 48 83 C4 58 C3 CC CC 4C', 'rdx', 8);
    attach('DialogueHook', '44 88 4C 24 20 41 B1 01 E8 ?? ?? ?? ?? 48 83 C4 58 C3 CC 33 C0', 'rdx', 8);

    function attach(name, pattern, register, offset) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        
        const address = results[0].address.add(offset);
        console.log(`[${name}] Found hook at ${address}`);
        let previous = '';

        Interceptor.attach(address, {
            onEnter: function (args) {
                try {
                    const ptr = this.context[register];
                    if (ptr.isNull()) return;

                    const rawText = ptr.readUtf8String();
                    if (!rawText || rawText === previous) return;
                    previous = rawText;

                    const cleanedText = rawText
                        .replace(/\[p\]/g, '無名') // replace protag name
                        .replace(/\[ft\].*?\[fe\]/g, '')
                        .replace(/\[fs\]|\[\/\]/g, '')
                        .replace(/\[\$.*?\]/g, '')
                        .replace(/\[c\d+\]/g, '')
                        .replace(/\[t\].*?\[\]/g, '')
                        .replace(/\[\]/g, '')
                        .trim();

                    if (cleanedText) {
                        console.log(`[DEBUG] Triggered: ${name}`);
                        handler(cleanedText);
                    }
                } catch (e) {
                }
            }
        });
    }
})();
