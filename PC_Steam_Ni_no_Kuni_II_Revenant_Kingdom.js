// ==UserScript==
// @name         Ni no Kuni II: Revenant Kingdom
// @version      4.00
// @author       [Kalleo]
// @description  Steam
// * Level-5
//
// https://store.steampowered.com/app/589360/Ni_no_Kuni_II_Revenant_Kingdom/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -200);

(function () {
    attach('CutsceneHook', 'E8 B1 9B B2 FF', 'rax'); // Cutscene Text
    attach('PtCHook', 'E8 92 9E DB FF', 'rdx'); // Press to Continue Text

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook ${address}`);
        Interceptor.attach(address, function (args) {
            const text = this.context[register].readUtf8String()
            .replace(/\\n/g, '\n')
            .replace(/<VALUE1>Ｇ \[CL\]獲得！\[C\]/g, '')
            .replace(/\[CL\]『<ITEM_NAME>』獲得！\[C\]/g, '')
            .replace(/『.*?』を　手に入れた！/g, '')
            .replace(/\[CL\]レベルアップ！\[C\]/g, '')
            .replace(/Lv\.\d+/g, '')
            .replace(/Ver\./g, '')
            .replace(/^\s*\/\s*$/gm, '')
            .replace(/『<ITEM_NAME>』を　<ITEM_NUM>個手に入れた！/g, '')
            .replace(/^\s*はい\s*$/gm, '')
            .replace(/\[\$sym02\]/g, '')
            .replace(/『.*?』を　\d+個手に入れた！/g, '');
            handler(text);
        });
    }
})();