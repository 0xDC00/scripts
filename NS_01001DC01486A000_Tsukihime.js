// ==UserScript==
// @name         [01001DC01486A000] 月姫 -A piece of blue glass moon-
// @version      0.2.1 - 1.0.1, 1.0.2
// @author       [DC]
// @description  Yuzu, Tsukihime
// * Aniplex (アニプレックス)
// * 
// KnowIssue: Prologue video (missed)
// ==/UserScript==
const gameVer = '1.0.1';
trans.replace(function (s) {
    return s
        .replace(/志貴さま/g, 'Shiki-Sama')
        .replace(/秋葉さま/g, 'Akiha-Sama')
        .replace(/秋葉/g, 'Akiha')
        .replace(/アルクェイド/g, 'Arcueid')
        .replace(/シエル/g, 'Ciel')
        .replace(/翡翠/g, 'Hisui')
        .replace(/琥珀/g, 'Kohaku')
        .replace(/ヴローヴ/g, 'Vlov')
        .replace(/ヴローヴ・アルハンゲリ/g, 'Vlov Arkhangel')
        .replace(/アルハンゲリ/g, 'Arkhangel')
        .replace(/弓塚/g, 'Yumizuka')
        .replace(/さつき/g, 'Satsuki')
        .replace(/ノエル/g, 'Noel')
        .replace(/阿良句/g, 'Arach')
        .replace(/マーリオゥ/g, 'Mario')
        .replace(/ジャッロ/g, 'Gallo')
        .replace(/ベスティーノ/g, 'Bestino')
        .replace(/安藤 /g, 'Ando')
        .replace(/裕吾/g, 'Yuugo')
        .replace(/ミハイル/g, 'Michael')
        .replace(/ロア/g, 'Roa')
        .replace(/バルダムヨォン/g, 'Valdamjong')
        .replace(/アカシャの蛇/g, 'Serpent of Akasha')
        .replace(/直死の魔眼/g, 'Mystic Eyes of Death Perception')
        .replace(/埋葬機関/g, 'Burial Agency')
        .replace(/第七聖典/g, 'Seventh holy Scipture')
        .replace(/屍鬼/g, 'Ghoul')
        .replace(/夜属/g, 'Nightkin')
        .replace(/夜魔/g, 'Nightmare')
        .replace(/死徒/g, 'Dead Apostle')
        .replace(/後継者/g, 'Successor')
        .replace(/光体/g, 'Luminous Body')
        .replace(/先輩/g, 'Senpai')
        .replace(/兄さん/g, 'Nii-San')
        .replace(/姉さん/g, 'Nee-San')
        .replace(/シキ/g, 'Shiki')
        .replace(/四季/g, 'SHIKI')
        .replace(/有間/g, 'Arima')
        .replace(/都古/g, 'Miyako')
        .replace(/啓子/g, 'Keiko')
        .replace(/文臣/g, 'Fumio')
        .replace(/軋間/g, 'Kishima')
        .replace(/久我峰/g, 'Kugamine')
        .replace(/刀崎/g, 'Touzaki')
        .replace(/月姫/g, 'Tsukihime')
        .replace(/有彦/g, 'Arihiko')
        .replace(/グランスルグ/g, 'Gransurg')
        .replace(/ブラックモア/g, 'Blackmore')
        .replace(/ネロ/g, 'Nero')
        .replace(/カオス/g, 'Chaos')
        .replace(/斎木/g, 'Saiki')
        .replace(/業人/g, 'Goto')
        .replace(/真相/g, 'True Ancestor')
        .replace(/魔眼/g, 'Mystic Eyes')
        .replace(/魅了の魔眼/g, 'Mystic Eyes of Enchantment')
        .replace(/暗示の魔眼/g, 'Mystic Eyes of Whisper')
        .replace(/埋葬機関/g, 'Burial Agency')
        .replace(/エレイシア/g, 'Elesia')
        .replace(/聖堂教会/g, 'Holy Church')
        .replace(/魔術協会/g, 'Mage\'s Association')
        .replace(/代行者/g, 'Executor')
        .replace(/摂理の鍵/g, 'Keys of Providence')
        .replace(/魔術/g, 'Magecraft')
        .replace(/根源/g, 'Root')
        .replace(/魔術師/g, 'Magus')
        .replace(/魔法使い/g, 'Magician')
        .replace(/総耶/g, 'Souya')
        .replace(/都立総耶高等学校/g, 'Metropolitan Souya High School')
        .replace(/死徒二十七祖/g, 'Twenty-seven Dead Apostle Ancestors')
        .replace(/神代連盟/g, 'League of the Age of Gods')
        .replace(/原理血戒/g, 'Idea Blood')
        .replace(/第七聖典/g, 'Seventh Holy Scripture')
        .replace(/火葬式典/g, 'Cremation Sacrament')
        .replace(/鉄甲作用/g, 'Iron Plate Effect')
        .replace(/土葬式典/g, 'Internment Rite')
        .replace(/幽閉塔/g, 'Tower of Imprisonment')
        .replace(/鬼種/g, 'Oni Kind')
        .replace(/紅赤朱/g, 'Crimson Red Vermillion')
        .replace(/反転衝動/g, 'Inversion Impulse')
        .replace(/幻想種/g, 'Phantasmal Species')
        .replace(/感応能力/g, 'Synchronization')
        .replace(/先生/g, 'Sensei')
        .replace(/青子/g, 'Aoko')
        .replace(/蒼崎/g, 'Aozaki')
        .replace(/魔眼殺し/g, 'Mystic Eyes Killer')
        ;
});
//------------------------------------------------
const { setHook } = require('./libYuzu.js');

const mainHandler = handler;

const udp101 = {
    0x80ac290: mainHandler
};

setHook({
    '1.0.0': {
        // TODO
    },
    '1.0.1': udp101,
    '1.0.2': udp101 // same exe
}[globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[2].value; // x2

    //const pc = this.context.pc;
    console.log('onEnter');
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    processBinaryString(address);
}

//------------------------------------------------
const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
let timerPreCheck = null, previousString = '', previousTime = 0;

function processBinaryString(address, condition) {
    const _address = address;
    let s = '', bottom = '', c;
    while (c = address.readU8()) {
        if (c >= 0x20) {  // readChar
            c = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
            s += c;
            address = address.add(encoder.encode(c).byteLength);
        }
        else { // readControl
            address = address.add(1);

            if (c == 1) { // ruby (01_text_02 03_ruby_04)
                bottom = '';
                while (true) {
                    c = decoder.decode(address.readByteArray(4))[0];
                    address = address.add(encoder.encode(c).byteLength);
                    if (c < '\u000a') break; // 0002
                    bottom += c;
                    s += c;
                }
            }
            else if (c == 3) {
                let rubi = '';
                while (true) {
                    c = decoder.decode(address.readByteArray(4))[0];
                    address = address.add(encoder.encode(c).byteLength);
                    if (c < '\u000a') break; // 0004
                    rubi += c;
                }
                console.log('rubi: ', rubi);
                console.log('char: ', bottom);
            }
            else if (c == 7) { // begin 07 30
                address = address.add(1);
            }
            else if (c == 0xa) { // delay
                if (address.readU8() === 0) {
                    console.log('Animating...');
                    return setTimeout(processBinaryString, 500, _address); // wait
                }
            }
            else if (c == 0xd) { // compress: 0d 03 c5 92 06
                c = address.readU32();
                const count = c & 0xFF;
                c = c & 0xFFFFFF00;
                if (c == 0x0692c500) {
                    s += '―'.repeat(count);
                    address = address.add(4);
                }
            }
            else {
                // do nothing
            }
        }
    }

    if (s) {
        const fromHook = condition === undefined; // hook or delay
        if (fromHook) {
            if (previousString === s) return console.log('>' + s);
            const currentTime = Date.now();
            s = previousString = currentTime - previousTime < 300 ? previousString + '\n' + s : s; // join fast string (choise)
            previousTime = currentTime;
        } else previousString = s;

        trans.send(s);

        // detect missed chars
        if (fromHook) {
            const blockSize = align(address.sub(_address).add(1).toInt32(), 4);
            const oldBuf = _address.readByteArray(blockSize);
            clearTimeout(timerPreCheck);
            timerPreCheck = setTimeout(function () {
                const newBuf = _address.readByteArray(blockSize);
                if (!equal32(oldBuf, newBuf)) {
                    processBinaryString(_address, true);
                }
            }, 2250);
        }
    }
}

function align(value, alignment) { // 1 2 4 8 16
    return (value + (alignment - 1)) & ~(alignment - 1);
}

function equal32(a, b) {
    const ua = new Uint32Array(a, 0, a.byteLength / 4);
    const ub = new Uint32Array(b, 0, b.byteLength / 4);
    return compare(ua, ub);
}

function compare(a, b) {
    for (let i = a.length; -1 < i; i -= 1) {
        if ((a[i] !== b[i])) return false;
    }
    return true;
}