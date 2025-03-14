// ==UserScript==
// @name         STEINS;GATE
// @version      0.1
// @author       [DC]
// @description  [PC] https://store.steampowered.com/app/412830/STEINSGATE/
// * MAGES Engine
// ==/UserScript==
const engine = require('./libPCMAGES.js');

const table = createTable();
const mainHandler = trans.send(handler, '250+');

engine.setHookDialog(mainHandler);
engine.setHookMail(table, trans.send);

function handler(regs, index) {
    const address = regs[index];

    console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));
    let s = engine.readString(address, table);

    return s;
}

//-------------------------------------------------
function createTable() {
    const table = [];

    // PrivateUseCharacters
    // https://github.com/CommitteeOfZero/sc3tools/blob/main/resources/sghd/compound_chars.map
    const compound_chars = `
[E000-E01A]=?
[E01C]=¹⁸
[E01D]=⁻¹⁹
[E01E]=⁻²⁴
[E01F]=キタ
[E020]=ー
[E021-E067]=①
[E068]=,_
[E06D-E07F]=?
[E094]=ｷﾞ
[E095]=ョエ
[E096]=カエ
[E097]=レ
[E098]=八八
[E099]=アッ
[E09A]=ー
[E09B]=マダ
[E09C]=ー
[E09D]=チン
[E09E]=オワ
[E09F]=タ
`.split(/\r?\n/).filter(i => i);
    for (const c of compound_chars) {
        const pair = c.split('=');
        if (pair.length != 2) continue;

        const key = pair[0].replace(/^\s*\[|\]$/g, '').split('-');
        const val = pair[1];

        if (key.length === 1) key.push(key[0]);

        const start = parseInt(key[0], 16);
        const end = parseInt(key[1], 16);
        for (let i = start; i <= end; i++) {
            const charCode = ((i & 0xFF) << 8) | i >> 8; // swap endian
            table[charCode] = val;
        }
    }

    // based on: https://github.com/CommitteeOfZero/sc3tools/tree/main/resources/sghd
    // Big thank you to the 1315 Team! (https://sites.google.com/view/gate1315/%ED%99%88)
    // row   : 59
    // column: 64 (1row = 64chars) ′
    const charset = (
        ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz　' + // 0 8000-803F
        '/:-;!?\\\'.@#%~*&`()°^>+<ﾉ･=″$′,[\]_{|}                           …' + // 1 8040-807F
        '０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ、。' + // 2 8080-80BF
        '，．：；？！゛゜‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＜＞〖〗・⋯〜ー♪―ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ①②' + // 3 80C0-80FF
        '③④⑤⑥⑦⑧⑨⑩⑪⑫⑬ⁿ²ー％–—＿／•①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①' + // 4 8100-813F
        '①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①①βγζημξρστυφχψωÅ√◯⌐¬∣¯Д∥αδεθικλνο' + // 5 8140-817F
        'πヽヾゝゞ〃仝々〆〇＼＋－±×÷＝≠＜＞≦≧∞∴♂♀℃￥＄￠￡％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓∈∋⊆⊇⊂⊃∪' + // 6 8180-81BF
        '∩∧∨￢⇒⇔∀∃∠⊥⌒∂∇≡≒≪≫∽∝∵∫∬‰♯♭♪†‡¶あいうえおかがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとど' + // 7 81C0-81FF
        'なにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもやゆよらりるれろわゐゑをんアイウエオカガキギクグケゲコゴサザシジスズセゼソゾタ' + // 8 8200-823F
        'ダチヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤユヨラリルレロヮワヰヱヲンヴΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟ' + // 9 8240-827F
        'ΠΡΣΤΥΦΧΨΩⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ∮∑∟⊿弘蓮喘嬌樹県粥匿燦村里衰蛙且扮瓶栽厭稿胄著殖籠媒腎郵舎筐因果律透明背徳再生分淳哉須' + // 10 8280-82BF
        '離喪失不可逆境界面上追加時間跳躍空理彷徨蝶翼夢幻形而虚像歪曲自己相似無限連鎖携帯電話呼出仮設定確認岐先指言右耳当通口聞完全音夏強' + // 11 82C0-82FF
        '烈日射受俺顎汗一滴落染作目前少女首傾見中学残顔今敵地潜入緊張感微塵手押向直人差添黙誰改切会気利倫太郎問題場変報告合的判断雑談危険' + // 12 8300-833F
        '鉢抜駆考機関動開驚声身深息小振運命石扉選択別葉最後刻懐神意志同味表存在知者世数早速足踏正突愚冒使階段来力尽椎名様子膝置額滲拭嬉笑' + // 13 8340-837F
        '実物立込彼幼年齢下歳高妹近家所昔鍵過酷宿負素質以普願安発成功記念銘打本鳳凰院凶真秘密組織狙狂難覚岡部文字幸好取嫌銭湯黄色桶教続半' + // 14 8380-83BF
        '諦始東京秋原駅称館登有特許持般詮試奥点化含程度男触集妨害嘲唇元識側放棄野逃卷勘弁語興休昼貴重割独脳天付事件起磁波攻撃揺衝屋震違悩' + // 15 83C0-83FF
        '多胸騒飛禁止視壊渡黒煙虹燐光舞爆鳴方奇妙体鎮座謎器大工衛星用係建頭疑然答躊躇何員困惑寄思両歩予待隠対応遠匂陰謀巡避決誘導戻姿探踊' + // 16 8400-843F
        '祥示横並欲眺心茶惜締甲冷期想雷翔施供海外火規模卵楕円犬類去流行忘保証浮玉厳貸平初甘金挿勢回挑戦恨輝児握司書皆盛拍迎現壇仏頂溢諸君' + // 17 8440-847F
        '史紀論終片信満態聴衆増注解返望経怒叫恥輪際乗資格若造眼怖線牧瀬紅莉栖友橋田至誌才講演内容春級卒業研究術載紹介掲写丸印象情周囲走従' + // 18 8480-84BF
        '売浴図悔引悪迫端整欠比美乱混沌私義捕華麗襲抵抗源慌逸精崩製焦筋縄略撤退隙詰距爛曈据惚純粋主悲罠薄汚泣辛冗得騙次士颯爽送単帰妥番油' + // 19 84C0-84FF
        '途着画審映延垂怪舌構帳倒肢護勝席支隅拉致都警戒訴万値皿風拾価能性悶劣互常軌総毛呑悟路消暗腰低慎進角伏服装絡鮮血溜死異殺他蒼白察皮' + // 20 8500-853F
        '斉由必遺裏払広焼肉親葬式恐寒抱央苦鈍吸犯救急車萌求伝謹奮静尚結局穢宮腐液膿傷浸章刺丈夫憶測銃状魔軽午徒瞬千愕摘説未配替我拠末町交' + // 21 8540-857F
        '蔵左折号檜山古居管房旧扱街需要寂店長王寺故市騰道楽材優秀随募属創趣活詳細闇権項派副産序某煩喋僕嫁氏住極即議砕法厨二病乙昨買威圧与' + // 22 8580-85BF
        '髪治偏屈腕青非頼針涙甜濃幅担役門戸叩申孤壮計仲恩反懸飽愛沈譲寿修蒸暑扇井閉超景牛丼客刹那量販快響陽炎況奢肩暴澄仕辺暮仰巨墜団狭防' + // 23 85C0-85FF
        '儀壁破宇宙圏燃嚙官如代制呆吐捨矢封狐継犠牲馬蔽国枢符納庫卓台労働飲料良損臓区室貧乏個雀贅沢促窓提衣羽習慣否脱揶揄棚順調推移務校縁' + // 24 8600-863F
        '月減令品具偶則栄挙粒砲繫五殻迷彩公洗練更每簡隔操到温了駄健凍課験把縫食検討腹痴接専録済秒例誤唸転影守達散敬礼慮骨誉鼻穴赤箱固弱球' + // 25 8640-867F
        '積為参環位覧敷陸涼効森羅越激訝観痛草週珍短届隣剣霊祟科伸幽頰柔肌凄惨裾懇丁寧燥老授瞥輩冠誕系刊留鋭猫析頑弾干唱及域娘姑偉渋港沖降' + // 26 8680-86BF
        '億遅伴屁穏夜鏡銀河領船潰拳擬往復机根余矛盾誇絶釈歯第堂齟齬柳林社祓脇川沿釣植木殿巫弊漆憐竹掃除夕刀僧助潮妖雨御武舗清斬邪忍税補酸' + // 27 86C0-86FF
        '謝師弟云匠鍛斐照瑕滅喜賛訪父棒紙幣商頃宝池袋泊鳥借憑雰熟罪劇噴尻眩型晶新裕吾障埃淀曰昭和揃枚遊絢将儲採算曖昧基板収費磨寝包挨拶朝' + // 28 8700-873F
        '袓久咳阿繁希賃暇孃硬熱鈴堵災厄遭妄緒遮勉喉潤技稀繰争勃蔓縦晒訳冊読眠索痕跡喫臭妻恋坂賑査十倍埋祭勧輸版展撮徹底排盗璧削桐郁噂賞複' + // 29 8740-877F
        '脚詣詞責任奪備句脅編換条閃呪省眉粘遣症耐約束聖兄案尾堅露尖嫉妬塗水承泳窺毒杉黎姉疾迅馴策胆亡召杯曜幹委敗鑑共臨種顕兵軍歴稼監胞沙' + // 30 8780-87BF
        '汰努請政府吹披蘇殊香械寸欧米爪艶康飾俗育鹿漏誓鬼畜暁契憧剰泌塞節歓勇偽凝遂祈塩準苛蛍灯履践疲些適稲漂麻痺等床肝励尊冥福鼓抑悸宛遡' + // 31 87C0-87FF
        '唯綻蹴溶易呂忙伐布処償錯頻鬱陶充迂闊煮八這曼陀癒弛緩絞架馳州核郊蓄嗅汲酬侵涉倉怠昏撫渴玄佳蟢螂紛唾佐灼獄営看溺札魂繕闘率雇狼狽花' + // 32 8800-883F
        '弄執覆搭縮岸皇北統晴漁缶描薩摩串列裸睡賢投姦英翻掛呵被掘善揉既督三各停叱咤癇癩裁築永膨述企魅宣捜豪滑維拒沽券獣概飯柄猛忠屑哲穫土' + // 33 8840-887F
        '垣拗益脆抹畏宗掌評詭範催旺翌吟憩楊枝盲荒賭戮奴隸褒縛歌荘棋盤駒陣競碁預雄凌駕旨厚漢託沸仁餌喝采怯渦卑疼奉諜協塊遇尋穿浅克敢氾濫餅' + // 34 8880-88BF
        '九憎湧辞職膳免漬婚軟候挾梢獵潔四喚津悠遙赦湿侮辱兼便荷麵匹母滞帝族欺瞞淡郷枠蓑財閥戯誠脂乾貼鑠叡麓斜島魚骸徴拷径庭箔捉標群占咎粛' + // 35 88C0-88FF
        '粉砂糖埼航唆雲罵肯愁旅却典徐泰軋絵繊愉援紫怨芸釀凹炭箇畑城百騎凱旋虜牢還靴慢唐稽控招股劫渾揮陥玩獲凡阻署猶挽灰勤柱訂恵没嵐鶯谷搔' + // 36 8900-893F
        '鶏抽坊癖轟諭吉啓嘆紳慰洋謦詐傑苑幾秩顛伊疎巣傍羨煎括西暖雁播贄捧軸禍緯刃軒旦医晦叶邂逅革袖胃糸陵剃裔醒肖櫛梳濡殴桜綺曇診菜民狩妊' + // 37 8940-897F
        '娠垢炸裂拓濁閏濯乳洩噌汁褐盆漠昇栗枕鍋涯甚博芝鳩豆鉄喰礎浚凸忽宅穂層網肘姓酔貫畳盟汝薬捉虫飄旗貌憂該祝芻拝悦腺哀賀擦冴遽臀蒙斑庇' + // 38 8980-89BF
        '泉浄培養辿娯倣穹漕牙羊宴逐稚猿晚餐拘逼矜襟剥禿踵肺腑脈酒仄朱岩檻虎眈峰均筒融拡療漫籍依績芽廃征幕欄芳剤誹謗溝巧顧蓋粗剛贈刮窒泥訓' + // 39 89C0-89FF
        '熊帽兆貯偵菓揚絆顰蹙菖蒲邁毅浜鷲闖隊覇硝園墓童傘煽梯痙攣綱蜂膜茨筑藍橙煌柵朦朧嗚咽瀕靖徘徊洪瀉嚥唄嚇俳傭摂駐惧忌辟抉豹閲咄嗟踪胴' + // 40 8A00-8A3F
        '較釘刑崇貢献班拐紐咆哮頓挫患紋翳碧措萎捗佇搾摺傻濾慨杖兎葛藤暦樽凛繭婦孫筆皺綴吊秤湾謳涎窃蹂躪紡峙摯雪慈牒腋給牌銷季嘔氷姫杞蔑冬' + // 41 8A40-8A7F
        '零憔悴芯潑剌靄栓脛孔媚撼彗郭牽臆堕濤累醜琴恍睫隈党肥貪埒麦辻棲柑橘腔珠昂澱斎桁襖椅棲頁赴閑蜃楼矯乖腫罰鐘蚊薔薇錬梁膏豊富砦朴僻猜' + // 42 8A80-8ABF
        '鉛蝉謐鞘謙遜弍傲呈敏滓批茂賽錠虐靱戚噓購廊咬衡耗懲逮巾貨塚南茅撒漿訊堪沬乞槌泡窮遵崎湘龍酢亭墟杭燈惹漸緻髄怜悧槍又鱗緑囵憤糊風孵' + // 43 8AC0-8AFF
        '朗彿庁貰藻酉僅瓦謂勿此株農沼攪諾塔婆熾轄双凵弦筈淫宜纏殲痩烹捏飢鷹詩剖磯江俊Я‐ë                       ' + // 44 8B00-8B3F
        'ギд㍉レーータ^                                                 ' + // 45 8B40-8B7F
        'ㄱㄲㄳㄴㄵㄶㄷㄸㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅃㅄㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ가각간갇갈갉갊갋감갑값갓갔' + // 46 8B80-8BBF
        '강갖갗같갚갛개객갠갣갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜걥거걱건걷걸걺검겁겂것겄겅겆겉겊겋게겍겐겔겜겝겟겠겡겨격겪견겯결겷겸겹겻겼경겿' + // 47 8BC0-8BFF
        '곁계곈곌곕곗곘고곡곤곧골곪곬곯곰곱곳공곶곹과곽관괄괆괌괍괏괐광괒괘괜괠괢괩괬괭괴괵괸괼굄굅굇굉교굔굘굠굡굣굥구국군굳굴굵굶굻굼굽' + // 48 8C00-8C3F
        '굿궁궂궃궈궉권궐궜궝궤궷궸귀귁귄귈귐귑귓귕규균귤귬귭그극근귿글긁긂긇금급긋긍긏긑긓긔긘긩기긱긴긷길긺김깁깃깄깅깆깊까깍깎깐깔깖깜' + // 49 8C40-8C7F
        '깝깟깠깡깥깨깩깬깯깰깸깹깻깼깽꺄꺅꺆꺌꺍꺠꺤꺼꺽꺾껀껄껌껍껏껐껑껓껕께껙껜껨껫껭껴껸껼꼇꼈꼉꼍꼐꼬꼭꼰꼲꼳꼴꼼꼽꼿꽁꽂꽃꽅꽈꽉꽌' + // 50 8C80-8CBF
        '꽐꽜꽝꽤꽥꽨꽸꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿏꿔꿘꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨뀰뀼끄끅끈끊끌끎끓끔끕끗끙끝끠끤끼끽낀낄' + // 51 8CC0-8CFF
        '낌낍낏낐낑나낙낚난낟날낡낢남납낫났낭낮낯낱낳내낵낸낻낼냄냅냇냈냉냐냑냔냗냘냠냡냣냥냬너넉넋넌넏널넑넒넓넘넙넛넜넝넢넣네넥넨넫넬넴' + // 52 8D00-8D3F
        '넵넷넸넹넾녀녁년녇녈념녑녔녕녘녜녠녱노녹논놀놁놂놈놉놋농놑높놓놔놘놜놥놨놰뇄뇌뇍뇐뇔뇜뇝뇟뇡뇨뇩뇬뇰뇸뇹뇻뇽누눅눈눋눌눍눔눕눗눙' + // 53 8D40-8D7F
        '눝눠눴눼뉘뉜뉠뉨뉩뉴뉵뉻뉼늄늅늉느늑는늗늘늙늚늠늡늣능늦늧늪늫늬늰늴늼늿닁니닉닌닏닐닒님닙닛닝닞닠닢다닥닦단닫달닭닮닯닳담답닷닸' + // 54 8D80-8DBF
        '당닺닻닽닿대댁댄댈댐댑댓댔댕댖댜댠댱더덕덖던덛덜덞덟덤덥덧덩덫덮덯데덱덴델뎀뎁뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗동돛돝돠돤' + // 55 8DC0-8DFF
        '돨돼됏됐되된될됨됩됫됬됭됴두둑둔둗둘둚둠둡둣둥둬뒀뒈뒙뒝뒤뒨뒬뒵뒷뒸뒹듀듄듈듐듕드득든듣들듥듦듧듬듭듯등듸듼딀디딕딘딛딜딤딥딧딨' + // 56 8E00-8E3F
        '딩딪딫딮따딱딲딴딷딸땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떄떈떔떙떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑뗘뗬또똑똔똘똠똡똣똥똬똭똰똴' + // 57 8E40-8E7F
        '뙇뙈뙜뙤뙨뚜뚝뚠뚤뚧뚫뚬뚯뚱뚸뛔뛰뛴뛸뜀뜁뜄뜅뜌뜨뜩뜬뜯뜰뜳뜸뜹뜻뜽뜾띃띄띈띌띔띕띠띡띤띨띰띱띳띵라락란랃랄람랍랏랐랑랒랖랗래랙' + // 58 8E80-8EBF
        '랜랟랠램랩랫랬랭랰랲랴략랸럅럇량럐럔러럭런럲럳럴럼럽럿렀렁렇레렉렌렐렘렙렛렜렝려력련렫렬렴렵렷렸령례롄롑롓로록론롣롤롬롭롯롱롸롹' + // 59 8EC0-8EFF
        '롼뢍뢔뢨뢰뢴뢸룀룁룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤈뤘뤠뤤뤼뤽륀륄륌륏륑류륙륜률륨륩륫륭르륵른를름릅릇릉릊릍릎릏릐릔리릭린릴림' + // 60 8F00-8F3F
        '립릿맀링맆마막만많맏말맑맒맔맘맙맛맜망맞맟맡맢맣매맥맨맫맬맴맵맷맸맹맺맻맽먀먁먄먈먐먕머먹먼멀멂멈멉멋멌멍멎멓메멕멘멛멜멤멥멧멨' + // 61 8F40-8F7F
        '멩멫며멱면멷멸몃몄명몇몌몐모목몫몬몯몰몱몲몸몹못몽뫄뫈뫘뫙뫠뫴뫼묀묄묌묍묏묑묘묜묠묩묫무묵묶문묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭤뭥' + // 62 8F80-8FBF
        '뭬뮈뮊뮌뮐뮙뮛뮤뮨뮬뮴뮷뮹므믁믄믈믐믑믓믕믜믠믭믱미믹민믿밀밂밈밉밋밌밍및밑바박밖밗반받발밝밞밟밣밤밥밧밨방밫밭배백밲밴밷밸뱀뱁' + // 63 8FC0-8FFF
        '뱃뱄뱅뱉뱌뱍뱐뱜뱝뱟뱡버벅번벋벌벎범법벗벘벙벚벝벟베벡벤벧벨벰벱벳벴벵벼벽변별볌볍볏볐병볓볕볘볜보복볶본볻볼볽볾볿봄봅봇봉봐봔봣' + // 64 9000-903F
        '봤봥봬뵀뵈뵉뵌뵐뵘뵙뵜뵤뵨뵴부북분붇불붉붊붐붑붓붔붕붙붚붜붝붠붤붭붰붴붸뷁뷔뷕뷘뷜뷥뷩뷰뷴뷸븀븁븃븅브븍븐블븕븜븝븟븡븨븩븰븽비' + // 65 9040-907F
        '빅빈빋빌빎빔빕빗빘빙빚빛빠빡빤빧빨빩빪빰빱빳빴빵빻빼빽빾뺀뺄뺌뺍뺏뺐뺑뺘뺙뺜뺨뻐뻑뻔뻗뻘뻙뻠뻣뻤뻥뻬뻰뼁뼈뼉뼌뼘뼙뼛뼜뼝뽀뽁뽄뽈' + // 66 9080-90BF
        '뽐뽑뽓뽕뾔뾰뾱뿅뿌뿍뿐뿔뿕뿜뿝뿟뿡쀠쀼쁑쁘쁜쁠쁨쁩쁭삐삑삔삘삠삡삣삥사삭삯산삳살삵삶삼삽삿샀상샅샆새색샌샏샐샘샙샛샜생샤샥샨샬샴' + // 67 90C0-90FF
        '샵샷샹샾섀섁섄섈섐섕서석섞섟선섣설섦섧섬섭섯섰성섶세섹센섿셀셈셉셋셌셍셑셔셕션셜셤셥셧셨셩셰셱셴셸솀솁솅소속솎손솓솔솖솜솝솟송솥' + // 68 9100-913F
        '솨솩솬솰솽쇄쇈쇌쇔쇗쇘쇠쇤쇨쇰쇱쇳쇴쇵쇼쇽숀숄숌숍숏숑숖수숙순숟술숨숩숫숭숯숱숲숴쉈쉐쉑쉔쉘쉠쉥쉬쉭쉰쉴쉼쉽쉿슁슈슉슌슐슘슛슝스' + // 69 9140-917F
        '슥슨슫슬슭슲슴습슷승싀싁시식신싣실싥싫심십싯싰싱싳싶싸싹싻싼싿쌀쌈쌉쌌쌍쌓쌔쌕쌘쌜쌤쌥쌨쌩쌰쌱썅써썩썬썰썲썸썹썼썽쎂쎄쎅쎈쎌쎔쎠' + // 70 9180-91BF
        '쎤쎵쎼쏀쏘쏙쏚쏜쏟쏠쏢쏨쏩쏭쏴쏵쏸쏼쐈쐋쐐쐤쐬쐰쐴쐼쐽쑀쑈쑝쑤쑥쑨쑬쑴쑵쑹쒀쒐쒔쒜쒠쒬쒸쒼쓔쓩쓰쓱쓴쓸쓺쓿씀씁씃씌씐씔씜씨씩씫씬' + // 71 91C0-91FF
        '씰씸씹씻씼씽씿아악안앉않앋알앍앎앏앓암압앗았앙앜앝앞애액앤앨앰앱앳앴앵야약얀얄얇얌얍얏얐양얕얗얘얜얠얩얬얭어억언얹얺얻얼얽얾엄업' + // 72 9200-923F
        '없엇었엉엊엌엎엏에엑엔엘엠엡엣엤엥여역엮연열엶엷염엽엾엿였영옅옆옇예옌옏옐옘옙옛옜옝오옥옦온옫올옭옮옯옰옳옴옵옷옹옻와왁완왈왎왐' + // 73 9240-927F
        '왑왓왔왕왘왜왝왠왬왭왯왰왱외왹왼욀욈욉욋욌욍요욕욘욜욤욥욧용우욱운욷울욹욺움웁웂웃웅웇워웍원월웜웝웟웠웡웨웩웬웰웸웹웻웽위윅윈윌' + // 74 9280-92BF
        '윔윕윗윘윙유육윤율윰윱윳융윷으윽윾은읃을읇읊음읍읎읏응읒읓읔읕읖읗의읜읠읨읩읫읬읭이익인읻일읽읾잃임입잇있잉잊잌잍잎자작잔잖잗잘' + // 75 92C0-92FF
        '잚잠잡잣잤장잦재잭잰잴잼잽잿쟀쟁쟈쟉쟌쟎쟐쟘쟝쟤쟨쟬쟵저적젂전젇절젉젊젋점접젓젔정젖제젝젠젤젬젭젯젱져젹젼졀졂졈졉졋졌졍졔조족존' + // 76 9300-933F
        '졸졺좀좁좃종좆좇좋좌좍좐좔좝좟좡좦좨좬좼좽죄죅죈죌죔죕죗죙죠죡죤죵주죽준줄줅줆줌줍줏중줘줬줴쥐쥑쥔쥘쥠쥡쥣쥬쥭쥰쥴쥼즁즈즉즌즐즒' + // 77 9340-937F
        '즘즙즛증즤지직진짇질짊짐집짓짔징짖짗짙짚짜짝짠짢짣짤짧짬짭짯짰짱짲째짹짼쨀쨈쨉쨋쨌쨍쨔쨘쨤쨩쨰쩌쩍쩐쩔쩜쩝쩟쩠쩡쩨쩰쩽쪄쪘쪼쪽쫀' + // 78 9380-93BF
        '쫃쫄쫌쫍쫏쫑쫒쫓쫘쫙쫜쫠쫬쫴쬈쬐쬔쬘쬠쬡쬧쬬쬭쬲쭁쭈쭉쭌쭐쭘쭙쭛쭝쭤쭸쭹쮀쮓쮜쮸쯍쯔쯕쯤쯧쯩찌찍찐찓찔찜찝찟찡찢찦찧차착찬찮찰참' + // 79 93C0-93FF
        '찹찻찼창찾찿채책챈챌챔챕챗챘챙챠챤챦챨챰챵처척천철첨첩첫첬청체첵첸첼쳄쳅쳇쳉쳊쳐쳔쳡쳤쳥쳬쳰촁초촉촌촐촘촙촛총촣촤촥촨촬촵촹쵀최' + // 80 9400-943F
        '쵠쵤쵬쵭쵯쵱쵸춈추축춘출춤춥춧충춰췄췌췍췐췔취췬췰췸췹췻췽츄츅츈츌츔츙츠측츤츨츩츰츱츳층츼치칙친칟칠칡칢침칩칫칬칭칮칰카칵칸칻칼' + // 81 9440-947F
        '캄캅캇캉캐캑캔캘캠캡캣캤캥캨캬캭캰컁컄커컥컨컫컬컴컵컷컸컹컽케켁켄켈켐켑켓켔켕켘켙켜켠켤켬켭켯켰켱켸코콕콘콛콜콤콥콧콩콰콱콴콸쾀' + // 82 9480-94BF
        '쾃쾅쾌쾡쾨쾰쿄쿈쿠쿡쿤쿨쿰쿱쿳쿵쿼쿽퀀퀄퀌퀑퀘퀜퀠퀭퀴퀵퀸퀼큄큅큇큉큐큔큘큠크큭큰큲클큼큽킁킄킈키킥킨킬킴킵킷킸킹타탁탄탇탈탉탐' + // 83 94C0-94FF
        '탑탓탔탕태택탠탤탬탭탯탰탱탸턍턔터턱턴털턺턻텀텁텃텄텅테텍텐텔템텝텟텡텦텨텬텰텻텼톄톈토톡톤톧톨톰톱톳통톺톼퇀퇘퇴퇸퇻툇툉툐툥투' + // 84 9500-953F
        '툭툰툴툶툼툽툿퉁퉈퉜퉤퉷튀튁튄튈튐튑튕튜튠튤튬튱트특튼튿틀틂틈틉틋틍틑틔틘틜틤틥티틱틴틸팀팁팃팅파팍팎판팑팓팔팖팜팝팟팠팡팤팥패' + // 85 9540-957F
        '팩팬팯팰팸팹팻팼팽퍄퍅퍝퍼퍽펀펄펌펍펏펐펑펖페펙펜펠펨펩펫펭펴펵편펼폄폅폈평폐폔폘폡폣포폭폰폴폼폽폿퐁퐅퐈퐉퐝푀푄표푠푤푭푯푸푹' + // 86 9580-95BF
        '푼푿풀풂품풉풋풍풔풩퓌퓐퓔퓜퓟퓨퓬퓰퓸퓻퓽프픈플픔픕픗픙픠픵피픽핀필핌핍핏핐핑하학한할핤핥함합핫항핰핳해핵핸핻핼햄햅햇했행햋햏햐' + // 87 95C0-95FF
        '햔햣향햬헀허헉헌헐헒헗험헙헛헝헠헡헣헤헥헨헬헴헵헷헸헹헿혀혁현혈혐협혓혔형혜혠혤혭호혹혼홀홅홈홉홋홍홑화확환활홥홧홨황홰홱홴횃횅' + // 88 9600-963F
        '회획횐횔횝횟횡효횬횰횹횻횽후훅훈훌훍훐훑훓훔훕훗훙훠훤훨훰훵훼훽휀휄휑휘휙휜휠휨휩휫휭휴휵휸휼흄흇흉흐흑흔흖흗흘흙흝흠흡흣흥흩희' + // 89 9640-967F
        '흰흴흼흽힁히힉힌힐힘힙힛힜힝힣' + // 90 9680-96BF
        '').replace(/\r|\n/g, '');

    let charCode;
    for (let i = 0; i < charset.length; i++) {
        // by index
        //table.push(charset[i]);

        // by code
        charCode = 0x8000 + i;
        charCode = ((charCode & 0xFF) << 8) | charCode >> 8; // swap endian (0x8001 -> 0x0180)
        table[charCode] = charset[i];
    }

    return table;
}
