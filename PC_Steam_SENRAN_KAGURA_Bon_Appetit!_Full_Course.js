// ==UserScript==
// @name         SENRAN KAGURA Bon Appétit! - Full Course
// @version      1.01.05
// @author       Tom (tomrock645)
// @description  Steam
// * developer   Meteorise
// * publisher   Marvelous
//
// https://store.steampowered.com/app/514310/SENRAN_KAGURA_Bon_Apptit__Full_Course/
// ==/UserScript==


console.warn("This game is a bit weird to make a script for and the script itself is janky, so it's far from perfect and some junk will be extracted at a few places. However, it does plenty the job.");
console.warn("Somehow the tutorial text boxes aren't hookable.")


const __e = Process.enumerateModules()[0];
const mainHandler = trans.send(s => s, 200);


let text = '';
let name = 'temp text';
let isNamed = false;
(function () { // The hook gets almost everything. Couldn't find a good address for the main text, so I opted for that
    const textSig = '8b f1 74 ?? 8b 56 28 8b c7 8a';
    var results = Memory.scanSync(__e.base, __e.size, textSig);
    // console.warn('\nMemory.scanSync() result: \n' + JSON.stringify(results));

    if (results.length === 0) {
        console.error('[textPattern] Hook not found!');
        return;
    }

    const address = results[0].address;
    console.log('[textPattern] Found hook', address);
    Interceptor.attach(address, function (args) {
        // console.warn("In: text");

        const textAddress = this.context.edi;
        let currentText = textAddress.readShiftJisString().replace(/^\d+回?$/g, "").trim();
        // console.warn("text: " + currentText);

        if (currentText === text || blockedTerms1.some(term => currentText.includes(term)) || blockedTerms2.some(term => currentText === term))// || currentText.length > 250)
            return;

        text = currentText;

        if (charactersNames.some(name => currentText === name)) {
            isNamed = true;
            name = currentText;
            return;
        }

        if (!isNamed)
            mainHandler(currentText);

        else {
            mainHandler(name + "\n" + currentText);
            isNamed = false;
        }
    })
})();
let charactersNames = ['飛鳥', '斑鳩', '葛城', '柳生', '雲雀', '大道寺', '焔', '詠', '日影', '未来', '春花', '雪泉', '叢', '夜桜', '四季', '美野里', '雅緋', '紫', '忌夢', '両備', '両奈', '凛'];

// For .includes()
let blockedTerms1 = ['◆', 'AppVer', 'FILE', 'NONE', 'スロットの選択', '01.', 'FPS', '鵤', '鵑', '鵐', '鶉', '鵺', '鶚', '鶲', '鵝', '鵞', '鵙', '鵲', '読込中・・・', 'タイトルへ', 'ﾕｵ', '入れ替えますか',
    'よろしいですか？', 'のランキングです。', '鶫', '表示切替', '操作表示', '画像収集枚数', '操作説明', '鶩', '鵯', '画像を拡大', '画像一覧に戻る', '画像を元', '時の操作】', '見たい画像', '未登録', 'を入手', '�'];
// For ===
let blockedTerms2 = ['05', 'はい', 'いいえ', '戻る', 'DOWN', 'RIGHT', 'LEFT', 'UP', 'W', 'S', 'A', 'D', 'Q', 'E', 'Enter', '・', '無音', '最大', 'オン', 'オフ', '決定', '日本語', '無し', 'ボーダーレス', '1920x1080',
    '▽', '次へ', 'ウィンドウ', 'フルスクリーン', '1600x900', '640x360', '1440x810', '1280x720', '1024x576', '設定を初期化する', '通常のボタン音', '自分の番付を見る', 'ランキング取得中', 'ーー', '-', '難易度選択', '交代',
    'キャラクターの初期衣装へ戻します。', 'おしながきに戻りますか？', 'お気に入り', '普通', '易しい', '難しい', '調理再開', '再試行', '設定', '調理放棄', '英才教育の賜物', ''];