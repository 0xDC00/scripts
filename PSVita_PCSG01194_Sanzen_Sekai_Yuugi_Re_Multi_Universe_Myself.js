// ==UserScript==
// @name         [PCSG01194] Sanzen Sekai Yuugi ~MultiUniverse Myself~
// @version      0.1
// @author       GO123
// @description  Vita3k
// * girls★dynamics
// * Dramatic Create
// * shin engine
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replaceAll("\n", '')

        ;
});
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
    0x8005ae24: mainHandler.bind_(null, 0, 0, "text")//dialouge+name
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter", hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let original = address.readShiftJisString();
    let s = remap(original);

    //console.log('Debug: ' + s);

    // O[A]#0542
    // https://github.com/ooa113y/kaleido/blob/2624a79ed6cd5a6126002035ce605144d447db21/rom-repack/layout.rb#L62
    // `右代宮　金蔵@r｢裸一貫@v01/11500029.｢裸一貫で生ﾏﾚﾀ｡@k@v01/11500030.ｿｼﾃ裸一貫で死ﾇﾞ@k@v01/11500031.馬鹿息子どﾓﾆ残ｼﾀｲﾓﾉﾅど何一ﾂﾅｲﾜッﾞﾞ@k@v01/11500032.ﾓｼﾓ訪ﾚﾙ最期が今日だ右代宮　真里亞@r@v13/10400173.｢ｳｰﾞ@k@v13/10400174.真里亞ﾓｵ子様ﾞ@k@v13/10400175.真里亞ﾓｵ子様ｰﾞ｣ああ@bﾀｼﾅ.@<嗜@>あああ`.split(/(?=@.)/)
    const parts = s.split(/(?=@.)/g);
    s = '';
    for (const part of parts) {
        if (part.startsWith('@') === false) {
            s += part;
            continue;
        }

        const tag = part.substring(0, 2);
        const content = part.substring(2);
        switch (tag) {
            case '@r':
                s += '\n' + content;
                continue;
            case '@u':
                const splited = content.split('.', 2); // param, text
                s += String.fromCharCode(splited[0]) + splited[1];
                continue;
            case '@b': // rubi begin: @bRUBY.
                console.log('rubi ' + content.slice(0, -1));
                continue;
            case '@<':
                console.log('rube ' + content);
                s += content;
                continue;

            case '@v':
            case '@w':
            case '@o':
            case '@a':
            case '@z':
            case '@c':
            case '@s':
                s += content.split('.', 2)[1];
                continue;

            case '@>': // rubi end
                s += content;
                continue;

            // TODO: test
            //case '@k':
            case '@[':
            case '@]':
            case '@{':
            case '@}':
            case '@|':
            //case '@y':
            case '@e':
            case '@t':
            case '@-':
                //console.log('Debug: `' + tag + '  ' + content + '`');
                s += content;
                continue;
            case '@k':
            case '@y':
                s += content;
                continue;

            default:
                console.log('Unrecognised dialogue tag: ' + tag);
                s += content;
                continue;
        }
    }
    // Patch: show whole line (remove animated & voice)
    //if (this.context.pc === 0x80b4560) address.writeUtf8String(original.replace(/\@k[^\@]*/g, '').replace(/\@v[^\.]+./g, ''));
    return s;


}
const katakanaMap = {
    '｢': '「', '｣': '」', 'ｧ': 'ぁ', 'ｨ': 'ぃ', 'ｩ': 'ぅ', 'ｪ': 'ぇ', 'ｫ': 'ぉ', 'ｬ': 'ゃ',
    'ｭ': 'ゅ', 'ｮ': 'ょ', 'ｱ': 'あ', 'ｲ': 'い', 'ｳ': 'う', 'ｴ': 'え', 'ｵ': 'お', 'ｶ': 'か',
    'ｷ': 'き', 'ｸ': 'く', 'ｹ': 'け', 'ｺ': 'こ', 'ｻ': 'さ', 'ｼ': 'し', 'ｽ': 'す', 'ｾ': 'せ',
    'ｿ': 'そ', 'ﾀ': 'た', 'ﾁ': 'ち', 'ﾂ': 'つ', 'ﾃ': 'て', 'ﾄ': 'と', 'ﾅ': 'な', 'ﾆ': 'に',
    'ﾇ': 'ぬ', 'ﾈ': 'ね', 'ﾉ': 'の', 'ﾊ': 'は', 'ﾋ': 'ひ', 'ﾌ': 'ふ', 'ﾍ': 'へ', 'ﾎ': 'ほ',
    'ﾏ': 'ま', 'ﾐ': 'み', 'ﾑ': 'む', 'ﾒ': 'め', 'ﾓ': 'も', 'ﾔ': 'や', 'ﾕ': 'ゆ', 'ﾖ': 'よ',
    'ﾗ': 'ら', 'ﾘ': 'り', 'ﾙ': 'る', 'ﾚ': 'れ', 'ﾛ': 'ろ', 'ﾜ': 'わ', 'ｦ': 'を', 'ﾝ': 'ん',
    'ｰ': 'ー', 'ｯ': 'っ', '､': '、', 'ﾟ': '？', 'ﾞ': '！', '･': '…', '?': '　', '｡': '。',
    '\uF8F0': '', '\uFFFD': '' // invalid (shift_jis A0 <=> EF A3 B0) | FF FD - F8F0)
};

function remap(s) {
    let result = '';
    for (const c of s) {
        const r = katakanaMap[c];
        result += r !== undefined ? r : c;
    }
    return result;
}