// ==UserScript==
// @name         Octopath Traveler
// @version      0.0.1
// @author       spongerobertosquarepantalones
// @description  Steam
//
// https://store.steampowered.com/app/921570/OCTOPATH_TRAVELER/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');

const processName = 'Octopath_Traveler-Win64-Shipping.exe';
if (__e.name !== processName) {
    console.error(`Make sure to attach to ${processName} instead of Octopath_Traveler.exe!`);
    return;
}

(function () {
    attach('Dialogue', 'E8 17 B6 83 01', 'rdx');

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
                handler(cleanText(text));
            }
        });
    }
})();

console.warn('Missing: menus');
console.warn('Missing: quest log');
console.warn('Missing: character bios (new game)');
console.warn('Missing: location notifications');
console.warn('Missing: scrutinize popup');
console.warn('Missing: action popup (e.g. some doors)')
console.warn('Missing: battles');


/**
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function isInstruction(text) {
    return /-?[\d]+/.test(text) || (text.includes('_') && !text.includes(' '));
}

/**
 * 
 * @param {string} text 
 * @returns {string}
 */
function cleanText(text) {
    return text.replace(/[\r\n]+/g, '').trim();
}