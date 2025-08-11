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
    attach('GeneralText', '66 66 0F 1F 84 00 ?? ?? ?? ?? 0F B7 1A', 'rdx'); // 66 66 0F 1F 84 00 00 00 00 00 0F B7 1A

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
            if (!isInstruction(text) && !isStandardAction(text)) {
                // console.log(name, "'", text, "'");
                handler(cleanText(text));
            }
        });
    }
})();


/**  
 * Checks if the text is an instruction embedded in dialogue, such as 'open_door' or '-1'
 * @param {string} text 
 * @returns {boolean}
 */
function isInstruction(text) {
    return /-?[\d]+/.test(text) || (text.includes('_') && !text.includes(' '));
}

/**
 * Checks if the text is a recurring action that would otherwise be spammed a lot, such as 'confirm', 'cancel', etc.
 * @param {string} text 
 * @returns {boolean}
 */
function isStandardAction(text) {
    return [
        '決定',
        '戻る',
        '選択',
        'キャンセル',
        'データ無し',
        'Auto Saving…',
        'Auto Saving …',
        '⑬ ボタンでパーティーチャットを再生',
        'ボタン長押しでスキップ',
        '閉じる',
        '外す',
        'ヘルプを閉じる'
    ].includes(text);
}

/**
 * @param {string} text 
 * @returns {string}
 */
function cleanText(text) {
    return text
        .replace(/[\r\n]+/g, '')
        .replace(/\\n/g, '\n')
        .trim();
}