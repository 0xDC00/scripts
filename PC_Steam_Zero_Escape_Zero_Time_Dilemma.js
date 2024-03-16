// ==UserScript==
// @name         Zero Escape: Zero Time Dilemma
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/311240/Zero_Escape_Zero_Time_Dilemma/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');

(function () {
    // Zero Escape.exe+6A080 - 55 - push ebp
    const dialogSig = '55 8B ?? 6A ?? 68 ???????? 64 ?? ???????? 50 83 ?? 1C 53 56 57 A1 ???????? 33 ?? 50 8D ?? ?? 64 ?? ???????? 66';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[DialoguePattern] Found hook', address);

    const buttons = {
        '0x00': 'B',
        '0x01': 'A',
        '0x02': 'Y',
        '0x03': 'X',
        '0x04': 'L1',
        '0x05': 'R1',
        '0x30': 'R2',
        '0x09': 'Start',
        '0x06': 'Left Stick',
        '0x31': 'Left Stick ↕',
        '0x32': 'Left Stick ↔',
        '0x0a': 'D-Pad',
        '0x0b': 'D-Pad ↑',
        '0x0c': 'D-Pad ↓',
        '0x0d': 'D-Pad ←',
        '0x0e': 'D-Pad →',
        '0x0f': 'D-Pad ↕',
        '0x10': 'D-Pad ↔',
        '0x13': 'Menu',
        '0x14': 'Save',
        '0x15': 'Switch',
        '0x16': 'Sort',
        '0x1b': 'Pencil',
        '0x1e': 'Eraser',
        '0x1f': 'Trash Can',
        '0x29': 'Flow',
        '0x2d': 'ゲーム終了',
    };

    let timer = 0;
    let lines = [];

    const callback = () => {
        const text = lines.join('\n')
            .replace(/{@cbGuideButton:([0-9a-fx]+?)}/g, (match, contents) => `[${buttons[contents] || 'Unknown'}]`)
            .trim();
        handler(text);
        lines = [];
    }

    Interceptor.attach(address, function (args) {
        const current = this.context.edi.readUtf16String();
        if (lines.length > 0 && lines[lines.length - 1].endsWith(current)) return;
        lines.push(current);
        clearTimeout(timer);
        timer = setTimeout(callback, 200);
    });
})();
