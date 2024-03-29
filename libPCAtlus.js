/*
https://github.com/Meloman19/PersonaEditor/blob/master/how_encoded_text.jpg

*/

/**
 * 
 * @param {string} type P4G, P5R
 * @returns {string[]}
 */
function createTable(type) {
    const table = [];
    let charset = "";

    const ASCII_RANGE = 0x7F;
    const CONTROL_CHARACTER_RANGE = 0x1F;
    const GLYPH_OFFSET = 0x60;
    const GLYPH_TABLE_SIZE = 0x80;
    const GLYPH_TABLE_START_INDEX = 0x80;

    if (type === "P3P") {
        charset = getCharsetP3P();
    }
    else if (type === "P4G") {
        charset = getCharsetP4G();
    }
    else if (type === "P5R") {
        charset = getCharsetP5R();
    }
    else {
        throw new Error("Unknown type");
    }

    // Fill table with SingleByte characters
    for (let charIndex = 0; charIndex <= ASCII_RANGE; charIndex++) {
        if (charIndex <= CONTROL_CHARACTER_RANGE) {
            table[charIndex] = String.fromCharCode(charIndex);
        }
        else {
            table[charIndex] = charset[charIndex];
        }
    }

    // Fill table with MultiByte characters
    for (let charIndex = 0x20; charIndex < charset.length; charIndex++) {
        const glyphIndex = charIndex + GLYPH_OFFSET;
        const tableIndex = Math.trunc(glyphIndex / GLYPH_TABLE_SIZE) - 1; // Integer division
        const firstByte = GLYPH_TABLE_START_INDEX | tableIndex;
        const secondByte = glyphIndex - (tableIndex * GLYPH_TABLE_SIZE);
        const charCode = (secondByte << 8) | firstByte;
        table[charCode] = charset[charIndex];
    }

    globalThis.atlusTable = table;
    return table;
}

function atlus_decode(charCode, table) {
    const c = table[charCode];
    return c !== undefined ? c : '[' + charCode.toString(16) + ']';
}

/**
 * 
 * @param {NativePointer} address 
 * @param {string[]} table 
 * @returns {string}
 */
function readString(address, table) {
    let s = '', c;
    while ((c = address.readU8()) !== 0) { // terminated
        if (0x0 <= c && c < 0x80) {
            address = address.add(1);
            s += atlus_decode(c, table);
        }
        else if (0x80 <= c && c < 0xF0) { // max tableIndex = F0
            const charCode = address.readU16();
            address = address.add(2);
            s += atlus_decode(charCode, table);
        }
        else if (0xF0 < c && c <= 0xFF) {
            const cmd = address.add(1).readU8();
            if (c === 0xF1 && cmd === 0x21) { // f121 and f124 ?
                address = address.add(2);
                //console.log("Leaving F121: " + address);
                return s;
            }
            const size = (c & 0x0F) * 2; // (F1 -> 2), (F2 -> 4), (F3 -> 6), (F4 -> 8) etc.. (need more test on higher numbers)
            address = address.add(size);
        }
        else {
            address = address.add(1);
        }
    }
    return s;
}

function getCharsetP3P() {
    return (
        '................' +
        '................' +
        ' !"#$%&′()*+,-./' +
        '0123456789:;<=>?' +
        '@ABCDEFGHIJKLMNO' +
        'PQRSTUVWXYZ[＼]^_' +
        '`abcdefghijklmno' +
        'pqrstuvwxyz{|}~ぁ' +
        'あぃいぅうぇえぉおかがきぎくぐけ' +
        'げこごさざしじすずせぜそぞただち' +
        'ぢっつづてでとどなにぬねのはばぱ' +
        'ひびぴふぶぷへべぺほぼぽまみむめ' +
        'もゃやゅゆょよらりるれろゎわゐゑ' +
        'をんァアィイゥウェエォオカガキギ' +
        'クグケゲコゴサザシジスズセゼソゾ' +
        'タダチヂッツヅテデトドナニヌネノ' +
        'ハバパヒビピフブプヘベペホボポマ' +
        'ミムメモャヤュユョヨラリルレロヮ' +
        'ワヰヱヲンヴヵヶ、。・゛゜´｀¨' +
        'ヽヾゝゞ〃❤々 〇ー‐～∥…‥“' +
        '〔〕〈〉《》「」『』【】－±×・' +
        '÷≠≦≧∞∴♂♀°′″℃￥￠￡§' +
        '☆★○●◎◇◆□■△▲▽▼※〒→' +
        '←↑↓〓ΑΒΓΔΕΖΗΘΙΚΛΜ' +
        'ΝΞΟΠΡΣΤΥΦΧΨΩαβγδ' +
        'εζηθικλμνξοπρστυ' +
        'φχψωАБВГДЕЁЖЗИЙК' +
        'ЛМНОПРСТУФХЦЧШЩЪ' +
        'ЫЬЭЮЯабвгдеёжзий' +
        'клмнопрстуфхцчшщ' +
        'ъыьэюя亜唖娃阿哀愛挨姶逢葵' +
        '茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻' +
        '飴絢綾鮎或粟袷安庵按暗案闇鞍杏以' +
        '伊位依偉囲夷委威尉惟意慰易椅為畏' +
        '異移維緯胃萎衣謂違遺医井亥域育郁' +
        '磯一壱溢逸稲茨芋鰯允印咽員因姻引' +
        '飲淫胤蔭院陰隠韻吋右宇烏羽迂雨卯' +
        '鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏' +
        '噂云運雲荏餌叡営嬰影映曳栄永泳洩' +
        '瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲' +
        '榎厭円園堰奄宴延怨掩援沿演炎焔煙' +
        '燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥' +
        '往応押旺横欧殴王翁襖鴬鴎黄岡沖荻' +
        '億屋憶臆桶牡乙俺卸恩温穏音下化仮' +
        '何伽価佳加可嘉夏嫁家寡科暇果架歌' +
        '河火珂禍禾稼箇花苛茄荷華菓蝦課嘩' +
        '貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓' +
        '駕介会解回塊壊廻快怪悔恢懐戒拐改' +
        '魁晦械海灰界皆絵芥蟹開階貝凱劾外' +
        '咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣' +
        '柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚' +
        '角赫較郭閣隔革学岳楽額顎掛笠樫橿' +
        '梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶' +
        '椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱粥刈' +
        '苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛' +
        '干幹患感慣憾換敢柑桓棺款歓汗漢澗' +
        '潅環甘監看竿管簡緩缶翰肝艦莞観諌' +
        '貫還鑑間閑関陥韓館舘丸含岸巌玩癌' +
        '眼岩翫贋雁頑顔願企伎危喜器基奇嬉' +
        '寄岐希幾忌揮机旗既期棋棄機帰毅気' +
        '汽畿祈季稀紀徽規記貴起軌輝飢騎鬼' +
        '亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議' +
        '掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐' +
        '逆丘久仇休及吸宮弓急救朽求汲泣灸' +
        '球究窮笈級糾給旧牛去居巨拒拠挙渠' +
        '虚許距鋸漁禦魚亨享京供侠僑兇競共' +
        '凶協匡卿叫喬境峡強彊怯恐恭挟教橋' +
        '況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭' +
        '暁業局曲極玉桐粁僅勤均巾錦斤欣欽' +
        '琴禁禽筋緊芹菌衿襟謹近金吟銀九倶' +
        '句区狗玖矩苦躯駆駈駒具愚虞喰空偶' +
        '寓遇隅串櫛釧屑屈掘窟沓靴轡窪熊隈' +
        '粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係' +
        '傾刑兄啓圭珪型契形径恵慶慧憩掲携' +
        '敬景桂渓畦稽系経継繋罫茎荊蛍計詣' +
        '警軽頚鶏芸迎鯨劇戟撃激隙桁傑欠決' +
        '潔穴結血訣月件倹倦健兼券剣喧圏堅' +
        '嫌建憲懸拳捲検権牽犬献研硯絹県肩' +
        '見謙賢軒遣鍵険顕験鹸元原厳幻弦減' +
        '源玄現絃舷言諺限乎個古呼固姑孤己' +
        '庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷' +
        '雇顧鼓五互伍午呉吾娯後御悟梧檎瑚' +
        '碁語誤護醐乞鯉交佼侯候倖光公功効' +
        '勾厚口向后喉坑垢好孔孝宏工巧巷幸' +
        '広庚康弘恒慌抗拘控攻昂晃更杭校梗' +
        '構江洪浩港溝甲皇硬稿糠紅紘絞綱耕' +
        '考肯肱腔膏航荒行衡講貢購郊酵鉱砿' +
        '鋼閤降項香高鴻剛劫号合壕拷濠豪轟' +
        '麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨' +
        '狛込此頃今困坤墾婚恨懇昏昆根梱混' +
        '痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐' +
        '鎖裟坐座挫債催再最哉塞妻宰彩才採' +
        '栽歳済災采犀砕砦祭斎細菜裁載際剤' +
        '在材罪財冴坂阪堺榊肴咲崎埼碕鷺作' +
        '削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷' +
        '察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三' +
        '傘参山惨撒散桟燦珊産算纂蚕讃賛酸' +
        '餐斬暫残仕仔伺使刺司史嗣四士始姉' +
        '姿子屍市師志思指支孜斯施旨枝止死' +
        '氏獅祉私糸紙紫肢脂至視詞詩試誌諮' +
        '資賜雌飼歯事似侍児字寺慈持時次滋' +
        '治爾璽痔磁示而耳自蒔辞汐鹿式識鴫' +
        '竺軸宍雫七叱執失嫉室悉湿漆疾質実' +
        '蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社' +
        '紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫' +
        '若寂弱惹主取守手朱殊狩珠種腫趣酒' +
        '首儒受呪寿授樹綬需囚収周宗就州修' +
        '愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯' +
        '週酋酬集醜什住充十従戎柔汁渋獣縦' +
        '重銃叔夙宿淑祝縮粛塾熟出術述俊峻' +
        '春瞬竣舜駿准循旬楯殉淳準潤盾純巡' +
        '遵醇順処初所暑曙渚庶緒署書薯藷諸' +
        '助叙女序徐恕鋤除傷償勝匠升召哨商' +
        '唱嘗奨妾娼宵将小少尚庄床廠彰承抄' +
        '招掌捷昇昌昭晶松梢樟樵沼消渉湘焼' +
        '焦照症省硝礁祥称章笑粧紹肖菖蒋蕉' +
        '衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈' +
        '丞乗冗剰城場壌嬢常情擾条杖浄状畳' +
        '穣蒸譲醸錠嘱埴飾拭植殖燭織職色触' +
        '食蝕辱尻伸信侵唇娠寝審心慎振新晋' +
        '森榛浸深申疹真神秦紳臣芯薪親診身' +
        '辛進針震人仁刃塵壬尋甚尽腎訊迅陣' +
        '靭笥諏須酢図厨逗吹垂帥推水炊睡粋' +
        '翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据' +
        '杉椙菅頗雀裾澄摺寸世瀬畝是凄制勢' +
        '姓征性成政整星晴棲栖正清牲生盛精' +
        '聖声製西誠誓請逝醒青静斉税脆隻席' +
        '惜戚斥昔析石積籍績脊責赤跡蹟碩切' +
        '拙接摂折設窃節説雪絶舌蝉仙先千占' +
        '宣専尖川戦扇撰栓栴泉浅洗染潜煎煽' +
        '旋穿箭線繊羨腺舛船薦詮賎践選遷銭' +
        '銑閃鮮前善漸然全禅繕膳糎噌塑岨措' +
        '曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡' +
        '鼠僧創双叢倉喪壮奏爽宋層匝惣想捜' +
        '掃挿掻操早曹巣槍槽漕燥争痩相窓糟' +
        '総綜聡草荘葬蒼藻装走送遭鎗霜騒像' +
        '増憎臓蔵贈造促側則即息捉束測足速' +
        '俗属賊族続卒袖其揃存孫尊損村遜他' +
        '多太汰詑唾堕妥惰打柁舵楕陀駄騨体' +
        '堆対耐岱帯待怠態戴替泰滞胎腿苔袋' +
        '貸退逮隊黛鯛代台大第醍題鷹滝瀧卓' +
        '啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只' +
        '叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹' +
        '単嘆坦担探旦歎淡湛炭短端箪綻耽胆' +
        '蛋誕鍛団壇弾断暖檀段男談値知地弛' +
        '恥智池痴稚置致蜘遅馳築畜竹筑蓄逐' +
        '秩窒茶嫡着中仲宙忠抽昼柱注虫衷註' +
        '酎鋳駐樗瀦猪苧著貯丁兆凋喋寵帖帳' +
        '庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸' +
        '蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃' +
        '鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬' +
        '柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭' +
        '低停偵剃貞呈堤定帝底庭廷弟悌抵挺' +
        '提梯汀碇禎程締艇訂諦蹄逓邸鄭釘鼎' +
        '泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄' +
        '典填天展店添纏甜貼転顛点伝殿澱田' +
        '電兎吐堵塗妬屠徒斗杜渡登菟賭途都' +
        '鍍砥砺努度土奴怒倒党冬凍刀唐塔塘' +
        '套宕島嶋悼投搭東桃梼棟盗淘湯涛灯' +
        '燈当痘祷等答筒糖統到董蕩藤討謄豆' +
        '踏逃透鐙陶頭騰闘働動同堂導憧撞洞' +
        '瞳童胴萄道銅峠鴇匿得徳涜特督禿篤' +
        '毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯' +
        '惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎' +
        '灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩' +
        '匂賑肉虹廿日乳入如尿韮任妊忍認濡' +
        '禰祢寧葱猫熱年念捻撚燃粘乃廼之埜' +
        '嚢悩濃納能脳膿農覗蚤巴把播覇杷波' +
        '派琶破婆罵芭馬俳廃拝排敗杯盃牌背' +
        '肺輩配倍培媒梅楳煤狽買売賠陪這蝿' +
        '秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝' +
        '漠爆縛莫駁麦函箱硲箸肇筈櫨幡肌畑' +
        '畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤' +
        '隼伴判半反叛帆搬斑板氾汎版犯班畔' +
        '繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮' +
        '匪卑否妃庇彼悲扉批披斐比泌疲皮碑' +
        '秘緋罷肥被誹費避非飛樋簸備尾微枇' +
        '毘琵眉美鼻柊稗匹疋髭彦膝菱肘弼必' +
        '畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票' +
        '表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌' +
        '浜瀕貧賓頻敏瓶不付埠夫婦富冨布府' +
        '怖扶敷斧普浮父符腐膚芙譜負賦赴阜' +
        '附侮撫武舞葡蕪部封楓風葺蕗伏副復' +
        '幅服福腹複覆淵弗払沸仏物鮒分吻噴' +
        '墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣' +
        '平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑' +
        '箆偏変片篇編辺返遍便勉娩弁鞭保舗' +
        '鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩' +
        '倣俸包呆報奉宝峰峯崩庖抱捧放方朋' +
        '法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽' +
        '鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒' +
        '冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲' +
        '朴牧睦穆釦勃没殆堀幌奔本翻凡盆摩' +
        '磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒' +
        '桝亦俣又抹末沫迄侭繭麿万慢満漫蔓' +
        '味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠' +
        '務夢無牟矛霧鵡椋婿娘冥名命明盟迷' +
        '銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟' +
        '毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾' +
        '貰問悶紋門匁也冶夜爺耶野弥矢厄役' +
        '約薬訳躍靖柳薮鑓愉愈油癒諭輸唯佑' +
        '優勇友宥幽悠憂揖有柚湧涌猶猷由祐' +
        '裕誘遊邑郵雄融夕予余与誉輿預傭幼' +
        '妖容庸揚揺擁曜楊様洋溶熔用窯羊耀' +
        '葉蓉要謡踊遥陽養慾抑欲沃浴翌翼淀' +
        '羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫' +
        '藍蘭覧利吏履李梨理璃痢裏裡里離陸' +
        '律率立葎掠略劉流溜琉留硫粒隆竜龍' +
        '侶慮旅虜了亮僚両凌寮料梁涼猟療瞭' +
        '稜糧良諒遼量陵領力緑倫厘林淋燐琳' +
        '臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺' +
        '怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂' +
        '廉恋憐漣煉簾練聯蓮連錬呂魯櫓炉賂' +
        '路露労婁廊弄朗楼榔浪漏牢狼篭老聾' +
        '蝋郎六麓禄肋録論倭和話歪賄脇惑枠' +
        '鷲亙亘鰐詫藁蕨椀湾碗腕\u0000\u0000\u0000\u0000\u0000' +
        '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000' +
        '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000' +
        '\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000酩酊煌蜃熾' +
        '祠跋扈巫憫蟲磔倅殲丼刹絆綺踪囁傲' +
        '貪偃榴弩鴉韋脛鋏髑髏祟鬱悍佇嗚邂' +
        '逅ⅠⅣ埒騙贖罠眸謳號蜻蛉鬣蠢洒眩' +
        '曰贄奢呟曖峙枷珈琲璧椒舐憑暫恍渾' +
        '颯痺賽瞑籠祀攪絆驕嬌眞祓闊唸埃呻' +
        '逞垓梵' +
        '').replace(/\r|\n/g, '');
}


function getCharsetP4G() {
    return (
        '................' +
        '................' +
        ' !"#$%&′()*+,-./' +
        '0123456789:;<=>?' +
        '@ABCDEFGHIJKLMNO' +
        'PQRSTUVWXYZ[＼]^_' +
        '`abcdefghijklmno' +
        'pqrstuvwxyz{|}~ぁ' +
        'あぃいぅうぇえぉおかがきぎくぐけ' +
        'げこごさざしじすずせぜそぞただち' +
        'ぢっつづてでとどなにぬねのはばぱ' +
        'ひびぴふぶぷへべぺほぼぽまみむめ' +
        'もゃやゅゆょよらりるれろゎわゐゑ' +
        'をんァアィイゥウェエォオカガキギ' +
        'クグケゲコゴサザシジスズセゼソゾ' +
        'タダチヂッツヅテデトドナニヌネノ' +
        'ハバパヒビピフブプヘベペホボポマ' +
        'ミムメモャヤュユョヨラリルレロヮ' +
        'ワヰヱヲンヴヵヶ、。・゛゜´｀¨' +
        'ヽヾゝゞ〃❤々 〇ー‐～∥…‥“' +
        '〔〕〈〉《》「」『』【】－±×・' +
        '÷≠≦≧∞∴♂♀°′″℃￥￠￡§' +
        '☆★○●◎◇◆□■△▲▽▼※〒→' +
        '←↑↓〓ΑΒΓΔΕΖΗΘΙΚΛΜ' +
        'ΝΞΟΠΡΣΤΥΦΧΨΩαβγδ' +
        'εζηθικλμνξοπρστυ' +
        'φχψωАБВГДЕЁЖЗИЙК' +
        'ЛМНОПРСТУФХЦЧШЩЪ' +
        'ЫЬЭЮЯабвгдеёжзий' +
        'клмнопрстуфхцчшщ' +
        'ъыьэюя亜唖娃阿哀愛挨姶逢葵' +
        '茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻' +
        '飴絢綾鮎或粟袷安庵按暗案闇鞍杏以' +
        '伊位依偉囲夷委威尉惟意慰易椅為畏' +
        '異移維緯胃萎衣謂違遺医井亥域育郁' +
        '磯一壱溢逸稲茨芋鰯允印咽員因姻引' +
        '飲淫胤蔭院陰隠韻吋右宇烏羽迂雨卯' +
        '鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏' +
        '噂云運雲荏餌叡営嬰影映曳栄永泳洩' +
        '瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲' +
        '榎厭円園堰奄宴延怨掩援沿演炎焔煙' +
        '燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥' +
        '往応押旺横欧殴王翁襖鴬鴎黄岡沖荻' +
        '億屋憶臆桶牡乙俺卸恩温穏音下化仮' +
        '何伽価佳加可嘉夏嫁家寡科暇果架歌' +
        '河火珂禍禾稼箇花苛茄荷華菓蝦課嘩' +
        '貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓' +
        '駕介会解回塊壊廻快怪悔恢懐戒拐改' +
        '魁晦械海灰界皆絵芥蟹開階貝凱劾外' +
        '咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣' +
        '柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚' +
        '角赫較郭閣隔革学岳楽額顎掛笠樫橿' +
        '梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶' +
        '椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱粥刈' +
        '苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛' +
        '干幹患感慣憾換敢柑桓棺款歓汗漢澗' +
        '潅環甘監看竿管簡緩缶翰肝艦莞観諌' +
        '貫還鑑間閑関陥韓館舘丸含岸巌玩癌' +
        '眼岩翫贋雁頑顔願企伎危喜器基奇嬉' +
        '寄岐希幾忌揮机旗既期棋棄機帰毅気' +
        '汽畿祈季稀紀徽規記貴起軌輝飢騎鬼' +
        '亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議' +
        '掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐' +
        '逆丘久仇休及吸宮弓急救朽求汲泣灸' +
        '球究窮笈級糾給旧牛去居巨拒拠挙渠' +
        '虚許距鋸漁禦魚亨享京供侠僑兇競共' +
        '凶協匡卿叫喬境峡強彊怯恐恭挟教橋' +
        '況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭' +
        '暁業局曲極玉桐粁僅勤均巾錦斤欣欽' +
        '琴禁禽筋緊芹菌衿襟謹近金吟銀九倶' +
        '句区狗玖矩苦躯駆駈駒具愚虞喰空偶' +
        '寓遇隅串櫛釧屑屈掘窟沓靴轡窪熊隈' +
        '粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係' +
        '傾刑兄啓圭珪型契形径恵慶慧憩掲携' +
        '敬景桂渓畦稽系経継繋罫茎荊蛍計詣' +
        '警軽頚鶏芸迎鯨劇戟撃激隙桁傑欠決' +
        '潔穴結血訣月件倹倦健兼券剣喧圏堅' +
        '嫌建憲懸拳捲検権牽犬献研硯絹県肩' +
        '見謙賢軒遣鍵険顕験鹸元原厳幻弦減' +
        '源玄現絃舷言諺限乎個古呼固姑孤己' +
        '庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷' +
        '雇顧鼓五互伍午呉吾娯後御悟梧檎瑚' +
        '碁語誤護醐乞鯉交佼侯候倖光公功効' +
        '勾厚口向后喉坑垢好孔孝宏工巧巷幸' +
        '広庚康弘恒慌抗拘控攻昂晃更杭校梗' +
        '構江洪浩港溝甲皇硬稿糠紅紘絞綱耕' +
        '考肯肱腔膏航荒行衡講貢購郊酵鉱砿' +
        '鋼閤降項香高鴻剛劫号合壕拷濠豪轟' +
        '麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨' +
        '狛込此頃今困坤墾婚恨懇昏昆根梱混' +
        '痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐' +
        '鎖裟坐座挫債催再最哉塞妻宰彩才採' +
        '栽歳済災采犀砕砦祭斎細菜裁載際剤' +
        '在材罪財冴坂阪堺榊肴咲崎埼碕鷺作' +
        '削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷' +
        '察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三' +
        '傘参山惨撒散桟燦珊産算纂蚕讃賛酸' +
        '餐斬暫残仕仔伺使刺司史嗣四士始姉' +
        '姿子屍市師志思指支孜斯施旨枝止死' +
        '氏獅祉私糸紙紫肢脂至視詞詩試誌諮' +
        '資賜雌飼歯事似侍児字寺慈持時次滋' +
        '治爾璽痔磁示而耳自蒔辞汐鹿式識鴫' +
        '竺軸宍雫七叱執失嫉室悉湿漆疾質実' +
        '蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社' +
        '紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫' +
        '若寂弱惹主取守手朱殊狩珠種腫趣酒' +
        '首儒受呪寿授樹綬需囚収周宗就州修' +
        '愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯' +
        '週酋酬集醜什住充十従戎柔汁渋獣縦' +
        '重銃叔夙宿淑祝縮粛塾熟出術述俊峻' +
        '春瞬竣舜駿准循旬楯殉淳準潤盾純巡' +
        '遵醇順処初所暑曙渚庶緒署書薯藷諸' +
        '助叙女序徐恕鋤除傷償勝匠升召哨商' +
        '唱嘗奨妾娼宵将小少尚庄床廠彰承抄' +
        '招掌捷昇昌昭晶松梢樟樵沼消渉湘焼' +
        '焦照症省硝礁祥称章笑粧紹肖菖蒋蕉' +
        '衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈' +
        '丞乗冗剰城場壌嬢常情擾条杖浄状畳' +
        '穣蒸譲醸錠嘱埴飾拭植殖燭織職色触' +
        '食蝕辱尻伸信侵唇娠寝審心慎振新晋' +
        '森榛浸深申疹真神秦紳臣芯薪親診身' +
        '辛進針震人仁刃塵壬尋甚尽腎訊迅陣' +
        '靭笥諏須酢図厨逗吹垂帥推水炊睡粋' +
        '翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据' +
        '杉椙菅頗雀裾澄摺寸世瀬畝是凄制勢' +
        '姓征性成政整星晴棲栖正清牲生盛精' +
        '聖声製西誠誓請逝醒青静斉税脆隻席' +
        '惜戚斥昔析石積籍績脊責赤跡蹟碩切' +
        '拙接摂折設窃節説雪絶舌蝉仙先千占' +
        '宣専尖川戦扇撰栓栴泉浅洗染潜煎煽' +
        '旋穿箭線繊羨腺舛船薦詮賎践選遷銭' +
        '銑閃鮮前善漸然全禅繕膳糎噌塑岨措' +
        '曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡' +
        '鼠僧創双叢倉喪壮奏爽宋層匝惣想捜' +
        '掃挿掻操早曹巣槍槽漕燥争痩相窓糟' +
        '総綜聡草荘葬蒼藻装走送遭鎗霜騒像' +
        '増憎臓蔵贈造促側則即息捉束測足速' +
        '俗属賊族続卒袖其揃存孫尊損村遜他' +
        '多太汰詑唾堕妥惰打柁舵楕陀駄騨体' +
        '堆対耐岱帯待怠態戴替泰滞胎腿苔袋' +
        '貸退逮隊黛鯛代台大第醍題鷹滝瀧卓' +
        '啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只' +
        '叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹' +
        '単嘆坦担探旦歎淡湛炭短端箪綻耽胆' +
        '蛋誕鍛団壇弾断暖檀段男談値知地弛' +
        '恥智池痴稚置致蜘遅馳築畜竹筑蓄逐' +
        '秩窒茶嫡着中仲宙忠抽昼柱注虫衷註' +
        '酎鋳駐樗瀦猪苧著貯丁兆凋喋寵帖帳' +
        '庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸' +
        '蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃' +
        '鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬' +
        '柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭' +
        '低停偵剃貞呈堤定帝底庭廷弟悌抵挺' +
        '提梯汀碇禎程締艇訂諦蹄逓邸鄭釘鼎' +
        '泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄' +
        '典填天展店添纏甜貼転顛点伝殿澱田' +
        '電兎吐堵塗妬屠徒斗杜渡登菟賭途都' +
        '鍍砥砺努度土奴怒倒党冬凍刀唐塔塘' +
        '套宕島嶋悼投搭東桃梼棟盗淘湯涛灯' +
        '燈当痘祷等答筒糖統到董蕩藤討謄豆' +
        '踏逃透鐙陶頭騰闘働動同堂導憧撞洞' +
        '瞳童胴萄道銅峠鴇匿得徳涜特督禿篤' +
        '毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯' +
        '惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎' +
        '灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩' +
        '匂賑肉虹廿日乳入如尿韮任妊忍認濡' +
        '禰祢寧葱猫熱年念捻撚燃粘乃廼之埜' +
        '嚢悩濃納能脳膿農覗蚤巴把播覇杷波' +
        '派琶破婆罵芭馬俳廃拝排敗杯盃牌背' +
        '肺輩配倍培媒梅楳煤狽買売賠陪這蝿' +
        '秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝' +
        '漠爆縛莫駁麦函箱硲箸肇筈櫨幡肌畑' +
        '畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤' +
        '隼伴判半反叛帆搬斑板氾汎版犯班畔' +
        '繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮' +
        '匪卑否妃庇彼悲扉批披斐比泌疲皮碑' +
        '秘緋罷肥被誹費避非飛樋簸備尾微枇' +
        '毘琵眉美鼻柊稗匹疋髭彦膝菱肘弼必' +
        '畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票' +
        '表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌' +
        '浜瀕貧賓頻敏瓶不付埠夫婦富冨布府' +
        '怖扶敷斧普浮父符腐膚芙譜負賦赴阜' +
        '附侮撫武舞葡蕪部封楓風葺蕗伏副復' +
        '幅服福腹複覆淵弗払沸仏物鮒分吻噴' +
        '墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣' +
        '平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑' +
        '箆偏変片篇編辺返遍便勉娩弁鞭保舗' +
        '鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩' +
        '倣俸包呆報奉宝峰峯崩庖抱捧放方朋' +
        '法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽' +
        '鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒' +
        '冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲' +
        '朴牧睦穆釦勃没殆堀幌奔本翻凡盆摩' +
        '磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒' +
        '桝亦俣又抹末沫迄侭繭麿万慢満漫蔓' +
        '味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠' +
        '務夢無牟矛霧鵡椋婿娘冥名命明盟迷' +
        '銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟' +
        '毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾' +
        '貰問悶紋門匁也冶夜爺耶野弥矢厄役' +
        '約薬訳躍靖柳薮鑓愉愈油癒諭輸唯佑' +
        '優勇友宥幽悠憂揖有柚湧涌猶猷由祐' +
        '裕誘遊邑郵雄融夕予余与誉輿預傭幼' +
        '妖容庸揚揺擁曜楊様洋溶熔用窯羊耀' +
        '葉蓉要謡踊遥陽養慾抑欲沃浴翌翼淀' +
        '羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫' +
        '藍蘭覧利吏履李梨理璃痢裏裡里離陸' +
        '律率立葎掠略劉流溜琉留硫粒隆竜龍' +
        '侶慮旅虜了亮僚両凌寮料梁涼猟療瞭' +
        '稜糧良諒遼量陵領力緑倫厘林淋燐琳' +
        '臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺' +
        '怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂' +
        '廉恋憐漣煉簾練聯蓮連錬呂魯櫓炉賂' +
        '路露労婁廊弄朗楼榔浪漏牢狼篭老聾' +
        '蝋郎六麓禄肋録論倭和話歪賄脇惑枠' +
        '鷲亙亘鰐詫藁蕨椀湾碗腕\u0000\u0000\u0000\u0000\u0000' +
        '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u3000\u3000\u3000\u3000' +
        '\u0000\u0000\u0000\u0000\u0000\u0000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000' +
        '\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000酩酊煌蜃熾' +
        '祠跋扈巫憫蟲磔倅殲丼刹絆綺踪囁傲' +
        '貪偃榴弩鴉韋脛鋏髑髏祟鬱悍佇嗚邂' +
        '逅ⅠⅣ埒騙贖罠眸謳號蜻蛉鬣蠢洒眩' +
        '曰贄奢呟曖峙枷珈琲璧椒舐憑暫恍渾' +
        '颯痺賽瞑籠祀攪絆驕嬌眞祓闊唸埃呻' +
        '焉鉈逞頷磋漱垓梵嗅甦淹慄嘘笄藺踵' +
        '澪凰鉤搏搗褄拗餃媚炸睨訝炒茹囮轢' +
        '彷拉爛駘訛鈿沽遽艘' +
        '').replace(/\r|\n/g, '');
}

function getCharsetP5R() {
    return (
        '................' +
        '................' +
        ' !"#$%&′()*+,-./' +
        '0123456789:;<=>?' +
        '@ABCDEFGHIJKLMNO' +
        'PQRSTUVWXYZ[＼]^_' +
        '`abcdefghijklmno' +
        'pqrstuvwxyz{|}~ぁ' +
        'あぃいぅうぇえぉおかがきぎくぐけ' +
        'げこごさざしじすずせぜそぞただち' +
        'ぢっつづてでとどなにぬねのはばぱ' +
        'ひびぴふぶぷへべぺほぼぽまみむめ' +
        'もゃやゅゆょよらりるれろゎわゐゑ' +
        'をんァアィイゥウェエォオカガキギ' +
        'クグケゲコゴサザシジスズセゼソゾ' +
        'タダチヂッツヅテデトドナニヌネノ' +
        'ハバパヒビピフブプヘベペホボポマ' +
        'ミムメモャヤュユョヨラリルレロヮ' +
        'ワヰヱヲンヴヵヶ、。・゛゜´｀¨' +
        'ヽヾゝゞ〃仝々〆〇ー‐～∥…‥“' +
        '〔〕〈〉《》「」『』【】－±×・' +
        '÷≠≦≧∞∴♂♀°′″℃￥￠￡§' +
        '☆★○●◎◇◆□■△▲▽▼※〒→' +
        '←↑↓〓ΑΒΓΔΕΖΗΘΙΚΛΜ' +
        'ΝΞΟΠΡΣΤΥΦΧΨΩαβγδ' +
        'εζηθικλμνξοπρστυ' +
        'φχψωАБВГДЕЁЖЗИЙК' +
        'ЛМНОПРСТУФХЦЧШЩЪ' +
        'ЫЬЭЮЯабвгдеёжзий' +
        'клмнопрстуфхцчшщ' +
        'ъыьэюя亜唖娃阿哀愛挨姶逢葵' +
        '茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻' +
        '飴絢綾鮎或粟袷安庵按暗案闇鞍杏以' +
        '伊位依偉囲夷委威尉惟意慰易椅為畏' +
        '異移維緯胃萎衣謂違遺医井亥域育郁' +
        '磯一壱溢逸稲茨芋鰯允印咽員因姻引' +
        '飲淫胤蔭院陰隠韻吋右宇烏羽迂雨卯' +
        '鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏' +
        '噂云運雲荏餌叡営嬰影映曳栄永泳洩' +
        '瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲' +
        '榎厭円園堰奄宴延怨掩援沿演炎焔煙' +
        '燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥' +
        '往応押旺横欧殴王翁襖鴬鴎黄岡沖荻' +
        '億屋憶臆桶牡乙俺卸恩温穏音下化仮' +
        '何伽価佳加可嘉夏嫁家寡科暇果架歌' +
        '河火珂禍禾稼箇花苛茄荷華菓蝦課嘩' +
        '貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓' +
        '駕介会解回塊壊廻快怪悔恢懐戒拐改' +
        '魁晦械海灰界皆絵芥蟹開階貝凱劾外' +
        '咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣' +
        '柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚' +
        '角赫較郭閣隔革学岳楽額顎掛笠樫橿' +
        '梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶' +
        '椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱粥刈' +
        '苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛' +
        '干幹患感慣憾換敢柑桓棺款歓汗漢澗' +
        '潅環甘監看竿管簡緩缶翰肝艦莞観諌' +
        '貫還鑑間閑関陥韓館舘丸含岸巌玩癌' +
        '眼岩翫贋雁頑顔願企伎危喜器基奇嬉' +
        '寄岐希幾忌揮机旗既期棋棄機帰毅気' +
        '汽畿祈季稀紀徽規記貴起軌輝飢騎鬼' +
        '亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議' +
        '掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐' +
        '逆丘久仇休及吸宮弓急救朽求汲泣灸' +
        '球究窮笈級糾給旧牛去居巨拒拠挙渠' +
        '虚許距鋸漁禦魚亨享京供侠僑兇競共' +
        '凶協匡卿叫喬境峡強彊怯恐恭挟教橋' +
        '況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭' +
        '暁業局曲極玉桐粁僅勤均巾錦斤欣欽' +
        '琴禁禽筋緊芹菌衿襟謹近金吟銀九倶' +
        '句区狗玖矩苦躯駆駈駒具愚虞喰空偶' +
        '寓遇隅串櫛釧屑屈掘窟沓靴轡窪熊隈' +
        '粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係' +
        '傾刑兄啓圭珪型契形径恵慶慧憩掲携' +
        '敬景桂渓畦稽系経継繋罫茎荊蛍計詣' +
        '警軽頚鶏芸迎鯨劇戟撃激隙桁傑欠決' +
        '潔穴結血訣月件倹倦健兼券剣喧圏堅' +
        '嫌建憲懸拳捲検権牽犬献研硯絹県肩' +
        '見謙賢軒遣鍵険顕験鹸元原厳幻弦減' +
        '源玄現絃舷言諺限乎個古呼固姑孤己' +
        '庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷' +
        '雇顧鼓五互伍午呉吾娯後御悟梧檎瑚' +
        '碁語誤護醐乞鯉交佼侯候倖光公功効' +
        '勾厚口向后喉坑垢好孔孝宏工巧巷幸' +
        '広庚康弘恒慌抗拘控攻昂晃更杭校梗' +
        '構江洪浩港溝甲皇硬稿糠紅紘絞綱耕' +
        '考肯肱腔膏航荒行衡講貢購郊酵鉱砿' +
        '鋼閤降項香高鴻剛劫号合壕拷濠豪轟' +
        '麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨' +
        '狛込此頃今困坤墾婚恨懇昏昆根梱混' +
        '痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐' +
        '鎖裟坐座挫債催再最哉塞妻宰彩才採' +
        '栽歳済災采犀砕砦祭斎細菜裁載際剤' +
        '在材罪財冴坂阪堺榊肴咲崎埼碕鷺作' +
        '削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷' +
        '察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三' +
        '傘参山惨撒散桟燦珊産算纂蚕讃賛酸' +
        '餐斬暫残仕仔伺使刺司史嗣四士始姉' +
        '姿子屍市師志思指支孜斯施旨枝止死' +
        '氏獅祉私糸紙紫肢脂至視詞詩試誌諮' +
        '資賜雌飼歯事似侍児字寺慈持時次滋' +
        '治爾璽痔磁示而耳自蒔辞汐鹿式識鴫' +
        '竺軸宍雫七叱執失嫉室悉湿漆疾質実' +
        '蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社' +
        '紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫' +
        '若寂弱惹主取守手朱殊狩珠種腫趣酒' +
        '首儒受呪寿授樹綬需囚収周宗就州修' +
        '愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯' +
        '週酋酬集醜什住充十従戎柔汁渋獣縦' +
        '重銃叔夙宿淑祝縮粛塾熟出術述俊峻' +
        '春瞬竣舜駿准循旬楯殉淳準潤盾純巡' +
        '遵醇順処初所暑曙渚庶緒署書薯藷諸' +
        '助叙女序徐恕鋤除傷償勝匠升召哨商' +
        '唱嘗奨妾娼宵将小少尚庄床廠彰承抄' +
        '招掌捷昇昌昭晶松梢樟樵沼消渉湘焼' +
        '焦照症省硝礁祥称章笑粧紹肖菖蒋蕉' +
        '衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈' +
        '丞乗冗剰城場壌嬢常情擾条杖浄状畳' +
        '穣蒸譲醸錠嘱埴飾拭植殖燭織職色触' +
        '食蝕辱尻伸信侵唇娠寝審心慎振新晋' +
        '森榛浸深申疹真神秦紳臣芯薪親診身' +
        '辛進針震人仁刃塵壬尋甚尽腎訊迅陣' +
        '靭笥諏須酢図厨逗吹垂帥推水炊睡粋' +
        '翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据' +
        '杉椙菅頗雀裾澄摺寸世瀬畝是凄制勢' +
        '姓征性成政整星晴棲栖正清牲生盛精' +
        '聖声製西誠誓請逝醒青静斉税脆隻席' +
        '惜戚斥昔析石積籍績脊責赤跡蹟碩切' +
        '拙接摂折設窃節説雪絶舌蝉仙先千占' +
        '宣専尖川戦扇撰栓栴泉浅洗染潜煎煽' +
        '旋穿箭線繊羨腺舛船薦詮賎践選遷銭' +
        '銑閃鮮前善漸然全禅繕膳糎噌塑岨措' +
        '曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡' +
        '鼠僧創双叢倉喪壮奏爽宋層匝惣想捜' +
        '掃挿掻操早曹巣槍槽漕燥争痩相窓糟' +
        '総綜聡草荘葬蒼藻装走送遭鎗霜騒像' +
        '増憎臓蔵贈造促側則即息捉束測足速' +
        '俗属賊族続卒袖其揃存孫尊損村遜他' +
        '多太汰詑唾堕妥惰打柁舵楕陀駄騨体' +
        '堆対耐岱帯待怠態戴替泰滞胎腿苔袋' +
        '貸退逮隊黛鯛代台大第醍題鷹滝瀧卓' +
        '啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只' +
        '叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹' +
        '単嘆坦担探旦歎淡湛炭短端箪綻耽胆' +
        '蛋誕鍛団壇弾断暖檀段男談値知地弛' +
        '恥智池痴稚置致蜘遅馳築畜竹筑蓄逐' +
        '秩窒茶嫡着中仲宙忠抽昼柱注虫衷註' +
        '酎鋳駐樗瀦猪苧著貯丁兆凋喋寵帖帳' +
        '庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸' +
        '蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃' +
        '鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬' +
        '柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭' +
        '低停偵剃貞呈堤定帝底庭廷弟悌抵挺' +
        '提梯汀碇禎程締艇訂諦蹄逓邸鄭釘鼎' +
        '泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄' +
        '典填天展店添纏甜貼転顛点伝殿澱田' +
        '電兎吐堵塗妬屠徒斗杜渡登菟賭途都' +
        '鍍砥砺努度土奴怒倒党冬凍刀唐塔塘' +
        '套宕島嶋悼投搭東桃梼棟盗淘湯涛灯' +
        '燈当痘祷等答筒糖統到董蕩藤討謄豆' +
        '踏逃透鐙陶頭騰闘働動同堂導憧撞洞' +
        '瞳童胴萄道銅峠鴇匿得徳涜特督禿篤' +
        '毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯' +
        '惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎' +
        '灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩' +
        '匂賑肉虹廿日乳入如尿韮任妊忍認濡' +
        '禰祢寧葱猫熱年念捻撚燃粘乃廼之埜' +
        '嚢悩濃納能脳膿農覗蚤巴把播覇杷波' +
        '派琶破婆罵芭馬俳廃拝排敗杯盃牌背' +
        '肺輩配倍培媒梅楳煤狽買売賠陪這蝿' +
        '秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝' +
        '漠爆縛莫駁麦函箱硲箸肇筈櫨幡肌畑' +
        '畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤' +
        '隼伴判半反叛帆搬斑板氾汎版犯班畔' +
        '繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮' +
        '匪卑否妃庇彼悲扉批披斐比泌疲皮碑' +
        '秘緋罷肥被誹費避非飛樋簸備尾微枇' +
        '毘琵眉美鼻柊稗匹疋髭彦膝菱肘弼必' +
        '畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票' +
        '表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌' +
        '浜瀕貧賓頻敏瓶不付埠夫婦富冨布府' +
        '怖扶敷斧普浮父符腐膚芙譜負賦赴阜' +
        '附侮撫武舞葡蕪部封楓風葺蕗伏副復' +
        '幅服福腹複覆淵弗払沸仏物鮒分吻噴' +
        '墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣' +
        '平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑' +
        '箆偏変片篇編辺返遍便勉娩弁鞭保舗' +
        '鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩' +
        '倣俸包呆報奉宝峰峯崩庖抱捧放方朋' +
        '法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽' +
        '鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒' +
        '冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲' +
        '朴牧睦穆釦勃没殆堀幌奔本翻凡盆摩' +
        '磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒' +
        '桝亦俣又抹末沫迄侭繭麿万慢満漫蔓' +
        '味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠' +
        '務夢無牟矛霧鵡椋婿娘冥名命明盟迷' +
        '銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟' +
        '毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾' +
        '貰問悶紋門匁也冶夜爺耶野弥矢厄役' +
        '約薬訳躍靖柳薮鑓愉愈油癒諭輸唯佑' +
        '優勇友宥幽悠憂揖有柚湧涌猶猷由祐' +
        '裕誘遊邑郵雄融夕予余与誉輿預傭幼' +
        '妖容庸揚揺擁曜楊様洋溶熔用窯羊耀' +
        '葉蓉要謡踊遥陽養慾抑欲沃浴翌翼淀' +
        '羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫' +
        '藍蘭覧利吏履李梨理璃痢裏裡里離陸' +
        '律率立葎掠略劉流溜琉留硫粒隆竜龍' +
        '侶慮旅虜了亮僚両凌寮料梁涼猟療瞭' +
        '稜糧良諒遼量陵領力緑倫厘林淋燐琳' +
        '臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺' +
        '怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂' +
        '廉恋憐漣煉簾練聯蓮連錬呂魯櫓炉賂' +
        '路露労婁廊弄朗楼榔浪漏牢狼篭老聾' +
        '蝋郎六麓禄肋録論倭和話歪賄脇惑枠' +
        '鷲亙亘鰐詫藁蕨椀湾碗腕♡♥🐾💀😁' +
        '😞😢😆😺💋✨・・・・\u3000\u3000\u3000\u3000\u3000\u3000' +
        '\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000' +
        '\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000酩酊煌蜃熾' +
        '祠跋扈巫憫蟲磔倅殲丼刹絆綺踪囁傲' +
        '貪偃榴弩鴉韋脛鋏髑髏祟鬱悍佇嗚邂' +
        '逅ⅠⅣ埒騙贖罠眸謳號蜻蛉鬣蠢洒眩' +
        '曰贄奢呟曖峙枷珈琲璧椒舐憑暫恍渾' +
        '颯痺賽瞑籠祀攪絆驕嬌眞祓闊唸埃呻' +
        '焉鉈逞頷磋漱垓梵嗅甦淹慄嘘笄藺踵' +
        '澪凰鉤搏搗褄拗餃媚炸睨訝炒茹囮轢' +
        '彷拉爛駘訛鈿沽遽艘屁几箋咆哮揉儚' +
        '弉冉矮嘲呵贔屓涎袂徨戮澤魑魍魎蛛' +
        '茫翔芒♪閻躾冤鸞屏藉咎刮攫腑婉餞' +
        '貶啖檻棍黎洸做軋嗜暈穢摯饉饒跪嵌' +
        '岾咥凛贅侘咤掟疼癪愕繚瑣獰簒恫痒' +
        '狡猾紆晰嶽緻憊俯迸邁躓謗瞞誅藪烙' +
        '瞼煥檸檬鍮辣蜀魏毟絨毯胄捏乖仄帷' +
        '匕筐彗僥竄幇餡筍緘僭苺撻杞錮朦朧' +
        '懺斃簀囃揶揄嗟眷蹂躙嘔焙涸喩譚撼' +
        '姜誂壺鬨荳蒄齎痙攣勒娑訶羞憚拮檜' +
        '蜥蜴毀猥隕詭躊躇燻蝸渗慟哭鍼彙剪' +
        '徘徊痍慇懃穹夥疸謐炙敲遙闖澁薔薇' +
        '搦沁棘羹鑽榜鑚皺悸櫃' +
        '').replace(/\r|\n/g, '');
}

module.exports = exports = {
    readString,
    createTable,
}
