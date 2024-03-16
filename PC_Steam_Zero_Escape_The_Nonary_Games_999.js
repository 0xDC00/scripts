// ==UserScript==
// @name         Zero Escape: The Nonary Games - Nine Hours, Nine Persons, Nine Doors (999)
// @version      0.1
// @author       [blacktide082]
// @description  Steam
// * Spike Chunsoft
//
// https://store.steampowered.com/app/477740/Zero_Escape_The_Nonary_Games/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');

console.warn(`
Known issues:
- When playing in Novel mode, lines that should be skipped from the Adventure mode
  dialogue will sometimes appear when there is a gap in the Novel mode dialogue.
`);

(function () {
    const dialogSig = '88 ?? ?? ?? 89 ?? ?? ?? 38 ?? 0F84 ???????? 8B ?? ?? ???????? 8B ?? 8D ?? ?? ?? E8';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] Hook not found!');
        return;
    }

    const address = results[0].address.add(0x8);
    console.log('[DialoguePattern] Found hook', address);

    let timeout = 0;
    let previous = ' ';
    let last = ' ';

    // In some dialogues, full-width hiragana characters are "encoded" as half-width katakana.
    // Hiragana with rendaku (ど, ざ, etc) are already left as hiragana in the dialogue and don't need conversion.
    const half = "､･｡ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const full = "、…。をぁぃぅぇぉゃゅょっーあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん";

    Interceptor.attach(address, function (args) {
        const raw = this.context.eax.readShiftJisString();
        const text = raw
            // handle the half-width katakana to full-width hiragana conversion
            .split('').map(c => full.charAt(half.indexOf(c)) || c).join('')
            .replace(/\s+/, ' ') // Replace consecutive whitespace with a single space
            .replace(/\u2473[A-z][\d\u2472]*/g, '') // remove some internal control codes
            .replace(/\u2473T([A-Z]+)@/g, '[$1]')   // reformat keyboard characters
            .replace(/^なし$/, '')  // skip the "なし" lines when no character is speaking
            .replace('\u25bc', '') // remove the black down pointing triangle character
            .trim();

        if (skip(raw, text)) return;

        previous = text;
        clearTimeout(timeout);
        timeout = setTimeout(() => handler(last = text), 200);
    });

    function skip(raw, text) {
        return !raw.endsWith('\u25bc') ||
            text.length <= 1 ||
            last.indexOf(text.substring(0, text.length - 1)) !== -1 ||
            previous.endsWith(text);
    }
})();
