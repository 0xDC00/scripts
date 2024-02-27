// ==UserScript==
// @name         [0100CC80140F8000] Triangle Strategy
// @version      1.1.0
// @author       [Kalleo]
// @description  Yuzu
// * Square Enix, Artdink
// *
// ==/UserScript==
const gameVer = '1.1.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, '500+');

setHook({
    '1.1.0': {
        [0x80aadebc - 0x80004000]: mainHandler.bind_(null, 0, "Main Text"),
        [0x81358ce4 - 0x80004000]: mainHandler.bind_(null, 3, "Secondary Text"),
        [0x80a38988 - 0x80004000]: mainHandler2.bind_(null, 0, "Info Contents"),
        [0x80aa4aec - 0x80004000]: mainHandler2.bind_(null, 0, "Info"),
        [0x80b1f300 - 0x80004000]: mainHandler.bind_(null, 0, "Difficulty Selection Part1"),
        [0x80b1f670 - 0x80004000]: mainHandler.bind_(null, 0, "Difficulty Selection Part2"),
        [0x80aa48f0 - 0x80004000]: mainHandler.bind_(null, 0, "PopUp Message"),
}
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

let previous = "";
function handler(regs, index, hookname) {
    const address = regs[index].value;
    // console.log('onEnter: ' + hookname);

    /* processString */
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = address.readUtf16String();

    s = s
    .replace(/^(?:スキップ|メニュー|バックログ|ズームイン|ズームアウト|ガイド OFF|早送り|オート|人物情報|ユニット表示切替|カメラリセット|ガイド表示切替|ページ切替|閉じる|コマンド選択|詳細|シミュレーション|移動)$(\r?\n|\r)?/gm, '') // Removing commands
    .replace(/[().%,_!#©&:?/]/g, '') // Remove specified symbols
    .replace(/[A-Za-z0-9]/g, '') // Remove letters and numbers
    .replace(/^\s*$/gm, ''); // Remove empty lines

    if (s === '') return null;

    if (s === previous) {
        return;
    }
    previous = s;

    return s;
}