// ==UserScript==
// @name         [0100F6A00A684000] Higurashi no Naku Koro ni Hou
// @version      1.0.0, 1.2.0
// @author       [DC]
// @description  Yuzu
// * ENTERGRAM
// * https://vndb.org/v23407
// ==/UserScript==
const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');

const mainHandler = trans.send(handler, '200+');

setHook({
    // AND  W8, W0, #0xFFFFFF
    // MOV  X0, X19
    // pattern: 08 5C 00 12 E0 03 13 AA
    '1.0.0': {
        [0x800bd6c8 - 0x80004000]: mainHandler, // ret x0 name + text (readShiftJisString)
        //[0x80083174 - 0x80004000]: mainHandler, // x0 name + text (readUtf8String) - E0 ? 03 91 ? 43 04 91
    },
    '1.2.0': {
        [0x800bdff8 - 0x80004000]: mainHandler, // 0x800bd6c8 instructions from 1.0.0 matched to 1.2.0
        //[0x800c2d20 - 0x80004000]: mainHandler, // ret x0 name + text (readShiftJisString)
        //[0x800869b0 - 0x80004000]: mainHandler, // x0 name + text (readUtf8String) - E0 ? 03 91 ? 43 04 91
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    console.log('onEnter 0x' + this.context.pc.toString(16));

    //console.log(hexdump(address));

    /* processString */
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
                s === '' ? s = content : s += '\n' + content;
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

// https://github.com/ooa113y/kaleido/blob/91d5333f38fd6541be3db1ee7d4539dcbd7ef900/utils.rb#L38
const katakanaMap = {
    '｢': '「', '｣': '」', 'ｧ': 'ぁ', 'ｨ': 'ぃ', 'ｩ': 'ぅ', 'ｪ': 'ぇ', 'ｫ': 'ぉ', 'ｬ': 'ゃ',
    'ｭ': 'ゅ', 'ｮ': 'ょ', 'ｱ': 'あ', 'ｲ': 'い', 'ｳ': 'う', 'ｴ': 'え', 'ｵ': 'お', 'ｶ': 'か',
    'ｷ': 'き', 'ｸ': 'く', 'ｹ': 'け', 'ｺ': 'こ', 'ｻ': 'さ', 'ｼ': 'し', 'ｽ': 'す', 'ｾ': 'せ',
    'ｿ': 'そ', 'ﾀ': 'た', 'ﾁ': 'ち', 'ﾂ': 'つ', 'ﾃ': 'て', 'ﾄ': 'と', 'ﾅ': 'な', 'ﾆ': 'に',
    'ﾇ': 'ぬ', 'ﾈ': 'ね', 'ﾉ': 'の', 'ﾊ': 'は', 'ﾋ': 'ひ', 'ﾌ': 'ふ', 'ﾍ': 'へ', 'ﾎ': 'ほ',
    'ﾏ': 'ま', 'ﾐ': 'み', 'ﾑ': 'む', 'ﾒ': 'め', 'ﾓ': 'も', 'ﾔ': 'や', 'ﾕ': 'ゆ', 'ﾖ': 'よ',
    'ﾗ': 'ら', 'ﾘ': 'り', 'ﾙ': 'る', 'ﾚ': 'れ', 'ﾛ': 'ろ', 'ﾜ': 'わ', 'ｦ': 'を', 'ﾝ': 'ん',
    'ｰ': 'ー', 'ｯ': 'っ', '､': '、', 'ﾟ': '？', 'ﾞ': '！', '･': '…', '?': '　', '｡': '。',
    '\uF8F0': '', '\uFFFD': '' // invalid (shift_jis A0 <=> EF A3 B0) | FF FD - F8 F0)
};

function remap(s) {
    let result = '';
    for (const c of s) {
        const r = katakanaMap[c];
        result += r !== undefined ? r : c;
    }
    return result;
}
