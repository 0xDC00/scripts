// ==UserScript==
// @name         [0100AC20128AC000] Chrono Cross: The Radical Dreamers Edition
// @version      1.0.2
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.2';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, -200);

setHook({
    '1.0.2': {
        [0x802b1254 - 0x80004000]: mainHandler.bind_(null, 1, "Text"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

console.log(`
* This script is only for Chrono Cross. The additional content, Radical Dreamers could not be hooked.

* Occasionally, you might encounter control codes like {party#2}, {itemWork(1)} and so on, which are used to reference items or party members. 

* I've tried replacing all playable characters' control codes with their original names. So, even if you change their names in the game, you'll still see their original names in the text outputted by Agent. 

* If you want to change this behavior, you can try modifying the regex in the script to the names you want.

* The script only captures the main text. any other UI element, menu etc.. will not be captured. Try using an OCR for those parts.
`);

function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf32StringLE();

    s = s
    .replace(/\{(?:mend|wait|wend|color)(?:\([^)]*\))?\}/g, '')
    .replace(/{bpage}/g, '\n')
    .replace(/{SERGE%}/g, 'セルジュ')
    .replace(/{SERGE%1}/g, 'セ')
    .replace(/{SERGE%2}/g, 'セル')
    .replace(/\{SERGE(?:%[0-9]*)?\}/g, 'セルジュ')
    .replace(/\{LYNX(?:%[0-9]*)?\}/g, 'ヤマネコ')
    .replace(/\{KID(?:%[0-9]*)?\}/g, 'キッド')
    .replace(/\{GUILE(?:%[0-9]*)?\}/g, 'アルフ')
    .replace(/\{NORRIS(?:%[0-9]*)?\}/g, 'イシト')
    .replace(/\{NIKKI(?:%[0-9]*)?\}/g, 'スラッシュ')
    .replace(/\{VIPER(?:%[0-9]*)?\}/g, '蛇骨大佐')
    .replace(/\{RIDDEL(?:%[0-9]*)?\}/g, 'リデル')
    .replace(/\{KARSH(?:%[0-9]*)?\}/g, 'カーシュ')
    .replace(/\{ZOA(?:%[0-9]*)?\}/g, 'ゾア')
    .replace(/\{MARCY(?:%[0-9]*)?\}/g, 'マルチェラ')
    .replace(/\{KORCHA(?:%[0-9]*)?\}/g, 'コルチャ')
    .replace(/\{LUCCIA(?:%[0-9]*)?\}/g, 'ルチアナ')
    .replace(/\{POSHUL(?:%[0-9]*)?\}/g, 'ポシュル')
    .replace(/\{RAZZLY(?:%[0-9]*)?\}/g, 'ラズリー')
    .replace(/\{ZAPPA(?:%[0-9]*)?\}/g, 'ザッパ')
    .replace(/\{ORCHA(?:%[0-9]*)?\}/g, 'オーチャ')
    .replace(/\{RADIUS(?:%[0-9]*)?\}/g, 'ラディウス')
    .replace(/\{FARGO(?:%[0-9]*)?\}/g, 'ファルガ')
    .replace(/\{MACHA(?:%[0-9]*)?\}/g, 'ママチャ')
    .replace(/\{GLENN(?:%[0-9]*)?\}/g, 'グレン')
    .replace(/\{LEENA(?:%[0-9]*)?\}/g, 'レナ')
    .replace(/\{MIKI(?:%[0-9]*)?\}/g, 'ミキ')
    .replace(/\{HARLE(?:%[0-9]*)?\}/g, 'ツクヨミ')
    .replace(/\{JANICE(?:%[0-9]*)?\}/g, 'ジャネス')
    .replace(/\{DRAGGY(?:%[0-9]*)?\}/g, '龍の子')
    .replace(/\{STARKY(?:%[0-9]*)?\}/g, '星の子')
    .replace(/\{SPRIGG(?:%[0-9]*)?\}/g, 'スプリガン')
    .replace(/\{MOJO(?:%[0-9]*)?\}/g, 'ラッキーダン')
    .replace(/\{TURNIP(?:%[0-9]*)?\}/g, 'カブ夫')
    .replace(/\{NEOFIO(?:%[0-9]*)?\}/g, '改良種フィオ')
    .replace(/\{GRECO(?:%[0-9]*)?\}/g, 'ジルベルト')
    .replace(/\{SKELLY(?:%[0-9]*)?\}/g, 'スカール')
    .replace(/\{FUNGUY(?:%[0-9]*)?\}/g, 'キノコ')
    .replace(/\{IRENES(?:%[0-9]*)?\}/g, 'イレーネス')
    .replace(/\{MEL(?:%[0-9]*)?\}/g, 'メル')
    .replace(/\{LEAH(?:%[0-9]*)?\}/g, 'リーア')
    .replace(/\{VAN(?:%[0-9]*)?\}/g, 'バンクリフ')
    .replace(/\{SNEFF(?:%[0-9]*)?\}/g, 'スネフ')
    .replace(/\{STEENA(?:%[0-9]*)?\}/g, 'スティーナ')
    .replace(/\{DOC(?:%[0-9]*)?\}/g, 'ドク')
    .replace(/\{GROBYC(?:%[0-9]*)?\}/g, 'ギャダラン')
    .replace(/\{PIERRE(?:%[0-9]*)?\}/g, 'ピエール')
    .replace(/\{ORLHA(?:%[0-9]*)?\}/g, 'オルハ')
    .replace(/\{PIP(?:%[0-9]*)?\}/g, 'ツマル')

    return s;
}