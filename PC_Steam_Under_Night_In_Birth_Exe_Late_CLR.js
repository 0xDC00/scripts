// ==UserScript==
// @name         Under Night In-Birth Exe:Late[cl-r]
// @version      1.04
// @author       Dualgas
// @description  Steam
// * FRENCH-BREAD (フランスパン)
//
// https://store.steampowered.com/app/801630/UNDER_NIGHT_INBIRTH_ExeLateclr/
// ==/UserScript==

const MAX_TEXTBOX_BYTES = 280;
const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

(function () {
    attach('DialogueHook', 'FF 50 30', 'edi');

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length < 2) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[1].address;
        console.log(`[${name}] Found hook ${address}`);
        Interceptor.attach(address, function (args) {
            const text = this.context[register].readShiftJisString(MAX_TEXTBOX_BYTES);
            handler(text);
        });
    }
})();

trans.replace((s) => {
	let text = s;
	text = text.split('\n\r')[0];
	return text;
});