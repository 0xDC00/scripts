// ==UserScript==
// @name         ToHeart Remake
// @version      0.1
// @author       koukdw
// @description  Steam
// * AQUAPLUS
// * Tamsoft Engine
//
// https://store.steampowered.com/app/3380520/ToHeart/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '250+');

(function () {
    // + 532ea5 rdi  demo
    attach('DialogueHook', 'E8 ?? ?? ?? ?? 48 8D 4B 18 48 8B D7 E8 ?? ?? ?? ?? 0F B6 44 24 50', 'rdi');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook ${address}`);
        Interceptor.attach(address, function (args) {
            //console.warn(hexdump(this.context['rdi'], { header: false, ansi: false, length: 0x50 }));
            const nameflag = this.context['r9'];
            //console.warn(`[Name flag]: ${nameflag}`);
            const name = this.context['rax'].readUtf8String();
            //console.warn(`[Name]: ${name}`);
            const text = this.context[register].readUtf8String().replaceAll('\n', '')
            //console.warn(`[Text]: ${text}`);
            let finaltext = nameflag == 1 ? text : name + '\n' + text;
            handler(finaltext.replace(/<[^>]*>/g, ''));
        });
    }
})();
