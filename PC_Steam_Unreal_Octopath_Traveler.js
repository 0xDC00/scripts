// ==UserScript==
// @name         Octopath Traveler
// @version      0.0.1
// @author       spongerobertosquarepantalones
// @description  Steam
//
// https://store.steampowered.com/app/921570/OCTOPATH_TRAVELER/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '700');

console.warn('Make sure to attach to Octopath_Traveler-Win64-Shipping.exe!');

(function () {
    attach('DialogueHook', 'E8 17 B6 83 01', 'rdx');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        if (results.length > 1) {
            console.warn(`[${name}] Multiple hooks found, using the first one.`);
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook ${address})`);
        Interceptor.attach(address, function (args) {
            const text = this.context[register].readUtf16String();
            if (!isInstruction(text)) {
                // console.log(name, "'", text, "'");
                handler(text);
            }
        });
    }
})();


/**
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function isInstruction(text) {
    return /-?[\d]+/.test(text) || (text.includes('_') && !text.includes(' '));
}