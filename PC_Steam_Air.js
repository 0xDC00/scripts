// ==UserScript==
// @name         AIR
// @version      1.0.0.0
// @author       [logantgt]
// @description  Steam
// * KEY/LUCA System
//
// https://store.steampowered.com/app/2983250/AIR/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -200);

// Filter out @ symbols around character names
trans.replace(function (s) {
    return s.replaceAll(/\@/g, '');
});

(function () {
    attach('DialogueHook', '0F B7 ?? 8D ?? ?? 66 ?? ?? ?? 8D ?? ?? 66 0F 47 CA 0F B7 ?? ?? ?? ?? 0F 94 C0 C3', 'r11');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
          console.error(`[${name}] Hook not found!`);
          return false;
        }
      
        let address = results[0].address;
        console.log(`\x1b[32m[${name}] Found hook ${address}\x1b[0m`);
        if (results.length > 1) {
          console.warn(`[${name}] has ${results.length} results`);
        }

        Interceptor.attach(address, function (args) {
            const text = this.context[register].readUtf16String();
            handler(text);
        });
    }
})();