// ==UserScript==
// @name         [0100A5B00BDC6000] Final Fantasy 7
// @version      1.0.3
// @author       hitsulol
// @description  Yuzu
// * Square Enix
// *
// ==/UserScript==
const gameVer = '1.0.3';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, -200);

setHook({
    '1.0.3': {
        [0x809d39f4 - 0x80004000]: mainHandler, // main dialogue/textbox
        [0x80e20024 - 0x80004000]: mainHandler, // tutorial text
        [0x80088594 - 0x80004000]: mainHandler, // item/materia description (returns when text (re-)appears) - some battle messages
    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

const common_table = createCommonTable();
const f6_table = createF6Table();
const fa_table = createKanjiFATable();
const fb_table = createKanjiFBTable();
const fc_table = createKanjiFCTable();
const fd_table = createKanjiFDTable();
const fe_table = createKanjiFETable();

function handler(regs) {
    const address = regs[0].value;
    //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = readString(address);
    s = s.replace(/^０A$/g, '').replace(/^Yビ/g, '');
    return s;
}


function readString(address) {
    console.log("read: " + address);
    let s = '', c;
    while ((c = address.readU8()) !== 0xFF && (c = address.readU8()) !== 0xE8) { //e8 newpage
        
        if(c === 0xFA)
        {
            address = address.add(1);
            const charCode= address.readU8();
            s += decode_ff7(charCode, fa_table);
            address = address.add(1);
        }
        else if(c === 0xFB)
        {
            address = address.add(1);
            const charCode= address.readU8();
            s += decode_ff7(charCode, fb_table);
            address = address.add(1);
        }
        else if(c === 0xFC)
        {
            address = address.add(1);
            const charCode= address.readU8();
            s += decode_ff7(charCode, fc_table);
            address = address.add(1);
        }
        else if(c === 0xFD)
        {
            address = address.add(1);
            const charCode= address.readU8();
            s += decode_ff7(charCode, fd_table);
            address = address.add(1);
        }    
        else if(c === 0xFE)
        {
            address = address.add(1);
            const charCode= address.readU8();
            if(charCode === 0xDC) //interrupt dialogue
                {
                    break;
                }
            s += decode_ff7(charCode, fe_table);
            address = address.add(1);
        }
        else if(c === 0xF6)
        {
            address = address.add(1);
            const charCode= address.readU8();
            s += decode_ff7(charCode, f6_table);
            address = address.add(1);
        }
        else{
            if(c === 0x3F || c === 0x00) //filter
            {
                let ct = 0;
                for(let i = 1; i <= 10; i++)
                {
                    ct += ((address.add(i).readU8()) === 0x3F);
                    ct += ((address.add(i).readU8()) === 0x00);
                }
                if(ct>=7)
                {
                    break;
                }
            }
            s += decode_ff7(c, common_table);
            address = address.add(1);
            continue;
        }
    }
    return s;
}


function decode_ff7(charCode, table) {
    const c = table[charCode];
    //if (c) return c;
    //return charCode;
    return c;
}

function createCommonTable(){
    const common_table = [];
    const chars = `
    [E1]=ギバ
    [E2]=グビ
    [E3]=ぅビ
    [E4]=
    [E5]=
    [E6]=ⅩⅢ
    [E8]=
    [E9]=
    [EA]=クラウド
    [EB]=バレット
    [EC]=ティファ
    [ED]=エアリス
    [EE]=レッドⅩⅢ
    [EF]=ユフィ
    [F0]=クラウド
    [F1]=セフィロス
    [F2]=シド
    [F3]=クラウド
    [F4]=エアリス
    [F5]=ぅぅぅぅぅぅぅぅぅ
    [F7]=X
    [F8]=Y
    [F9]=B
    `.split(/\r?\n/).filter(i => i);
    for (const c of chars) {
        const pair = c.split('=');
        
        if (pair.length != 2) continue;
        
        const key = pair[0].replace(/^\s*\[|\]$/g, '').split('-');
        
        const val = pair[1];
        if (key.length === 1) key.push(key[0]);

        const start = parseInt(key[0], 16);
        const end = parseInt(key[1], 16);
        for (let i = start; i <= end; i++) {
            common_table[i] = val;
        }
        
    }
    common_table[0xE7] = "\n";
    
    const tableString = (
        'バばビびブぶベベボぼガがギぎグぐ' + 
        'ゲげゴごザざジじズずゼぜゾぞダだ' + 
        'ヂぢヅづデでドどヴパぱピぴプポペ' + 
        'ペポぽ０１２３４５６７８９、。 ' + 
        'ハはヒひフふへへホほカかキきクく' + 
        'ケけコこサさシしスすセせソそタた' + 
        'チちツつテてトとウうアあイいエえ' + 
        'オおナなニにヌぬネねノのマまミみ' + 
        'ムむメめモもラらリリルるレれロろ' + 
        'ヤやユゆヨよワわンんヲをッっャゃ' + 
        'ュゅョょァぁィぃゥぅェぇォぉ！？' + 
        '『』.十ABCDEFGHIJKL' + 
        'MNOPQRSTUVWXYZ・*' + 
        '―~…％/：＆【】❤→αβ「」（' + 
        '）'
    )
    
    
    for (let i = 0; i < tableString.length; i++) {
        common_table[i] = tableString[i];
    }
    return common_table;
}

function createF6Table(){
    const f6_table = [];
    const chars = `
    [33]=A
    [34]=L
    [35]=ZL
    [36]=R
    [37]=ZR
    [38]=+
    [39]=-
    [3A]=↑
    [3B]=↓
    [3C]=←
    [3D]=→
    `.split(/\r?\n/).filter(i => i);
    for (const c of chars) {
        const pair = c.split('=');
        
        if (pair.length != 2) continue;
        
        const key = pair[0].replace(/^\s*\[|\]$/g, '').split('-');
        
        const val = pair[1];
        if (key.length === 1) key.push(key[0]);

        const start = parseInt(key[0], 16);
        const end = parseInt(key[1], 16);
        for (let i = start; i <= end; i++) {
            f6_table[i] = val;
            
        }
        
    }

    return f6_table;
}

function createKanjiFATable(){
    const fa_table = [];
    for (let i = 0; i < 256; i++) {
        fa_table[i] = "";
    }
    
    const chars = '［］；＇｀¥，／＾＠＿↑←↓漢';
    for (let i = 0; i < chars.length; i++) {
        fa_table[i+0xE0] = chars[i];
    }
            
    const tableString = (
        '必殺技地獄火炎裁雷大怒斬鉄剣槍海' + 
        '衝聖審判転生改暗黒釜天崩壊零式自' + 
        '爆使放射臭息死宣告凶破晄撃画龍晴' + 
        '点睛超究武神覇癒風邪気封印吹烙星' + 
        '守護命鼓動福音掌打水面蹴乱闘合体' + 
        '疾迅明鏡止抜山蓋世血祭鎧袖一触者' + 
        '滅森羅万象装備器攻魔法召喚獣呼出' + 
        '持相手物確率弱投付与変化片方行決' + 
        '定分直前真似覚列後位置防御発回連' + 
        '続敵全即効果尾毒消金針乙女興奮剤' + 
        '鎮静能薬英雄榴弹右腕砂時計糸戦惑' + 
        '草牙南極冷結晶電鳥角有害質爪光月' + 
        '反巨目砲重力球空双野菜実兵単毛茶' + 
        '色髪'
    )
    
    
    for (let i = 0; i < tableString.length; i++) {
        fa_table[i] = tableString[i];
    }
    return fa_table;
}

function createKanjiFBTable(){
    const fb_table = [];
    for (let i = 0; i < 256; i++) {
        fb_table[i] = "";
    }
    
    const tableString = (
        '安香花会員蜂蜜館下着入先不子供屋' + 
        '商品景交換階模型部離場所仲間無制' + 
        '限殿様秘氷河図何材料雪上進事古代' + 
        '種鍵娘紙町住奥眠楽最初村雨釘陸吉' + 
        '揮叢雲軍異常通威父蛇矛青偃刀戟十' + 
        '字裏車円輪卍折鶴倶戴螺貝突銀玉正' + 
        '宗具甲烈属性吸収半減土高級状態縁' + 
        '闇睡石徐々的指混呪開始步復盗小治' + 
        '理同速遅逃去視複味沈黙還倍数瀕取' + 
        '返人今差誰当拡散飛以外暴避振身中' + 
        '旋津波育機械擲炉新両本君洞内作警' + 
        '特殊板強穴隊族亡霊鎖足刃頭怪奇虫' + 
        '跳侍左首潜長親衛塔宝条像忍謎般見' + 
        '報充填完了銃元経験値終獲得名悲蛙' + 
        '操成費背切替割由閉記憶選番街底忘' + 
        '都過艇路運搬船基心港'
    )
    
    
    for (let i = 0; i < tableString.length; i++) {
        fb_table[i] = tableString[i];
    }
    return fb_table;
}

function createKanjiFCTable(){
    const fc_table = [];
    for (let i = 0; i < 256; i++) {
        fc_table[i] = "";
    }
    
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < chars.length; i++) {
        fc_table[i+0xE0] = chars[i];
    }    
    
    const tableString = (
        '由閉記憶選番街底忘都過艇路運搬船' + 
        '墓心港末宿西道艦家乗竜巻迷宮絶壁' + 
        '支社久件想秒予多落受組余系標起迫' + 
        '日勝形引現解除磁互口廃棄汚染液活' + 
        '令副隠主斉登温泉百段熱走急降奪響' + 
        '嵐移危戻遠吠軟骨言葉震叫噴舞狩粉' + 
        '失敗眼激盤逆鱗踏喰盾叩食凍退木吐' + 
        '線魅押潰曲翼教皇太陽界案挑援赤往' + 
        '殴意東北参知聞来仕別集信用思每悪' + 
        '枯考然張好伍早各独配腐話帰永救感' + 
        '故売浮市加流約宇礼束母男年待宙立' + 
        '残俺少精士私険関倒休我許郷助要問' + 
        '係旧固荒稼良議導夢追説声任柱満未' + 
        '顔旅'
    )
    
    
    for (let i = 0; i < tableString.length; i++) {
        fc_table[i] = tableString[i];
    }
    return fc_table;
}

function createKanjiFDTable(){
    const fd_table = [];
    for (let i = 0; i < 256; i++) {
        fd_table[i] = "";
    }
    
    const chars = `
    [F0]=A
    [F1]=B
    [F2]=Y
    [F3]=↑
    [F4]=←
    [F5]=→
    [F6]=↓
    [F7]=S2
    [F8]=X
    [F9]=L1
    [FA]=R1
    [FB]=R2
    [FC]=S1
    [FD]=L2
    [FE]=←/→
    [FF]=方向
    `.split(/\r?\n/).filter(i => i);
    for (const c of chars) {
        const pair = c.split('=');
        if (pair.length != 2) continue;
        
        const key = pair[0].replace(/^\s*\[|\]$/g, '').split('-');
        
        const val = pair[1];
        if (key.length === 1) key.push(key[0]);

        const start = parseInt(key[0], 16);
        const end = parseInt(key[1], 16);
        for (let i = start; i <= end; i++) {
            fd_table[i] = val;
        }
        
    }
    
    const tableString = (
        '友伝夜探対調民読占頼若学識業歳争' + 
        '苦織困答準恐認客務居他再幸役縮情' + 
        '豊夫近窟責建求迎貸期工算湿難保帯' + 
        '届凝笑向可遊襲申次国素題普密望官' + 
        '泣創術演輝買途浴老幼利門格原管牧' + 
        '炭彼房驚禁注整衆語証深層査渡号科' + 
        '欲店括坑酬緊研権書暇兄派造広川賛' + 
        '駅絡在党岸服搜姉敷胸刑谷痛岩至勢' + 
        '畑姿統略抹展示修酸製歓接障災室索' + 
        '扉傷録優基讐勇司境璧医怖狙協犯資' + 
        '設雇根億脱富躍純写病依到練順園総' + 
        '念維検朽圧補公働因朝浪祝恋郎勉春' + 
        '功耳恵緑美辺昇悩泊低酒影競二矢瞬' + 
        '希志'
    )
    
    
    for (let i = 0; i < tableString.length; i++) {
        fd_table[i] = tableString[i];
    }
    return fd_table;
}

function createKanjiFETable(){
    const fe_table = [];
    
    for (let i = 0; i < 256; i++) {
        fe_table[i] = "";
    }
    
    const tableString = (
        '孫継団給抗違提断島栄油就僕存企比' + 
        '浸非応細承編排努締談趣埋営文夏個' + 
        '益損額区寒簡遣例肉博幻量昔臓負討' + 
        '悔膨飲妄越憎增枚皆愚療庫涙照冗壇' + 
        '坂訳抱薄義騒奴丈捕被概招劣較析繁' + 
        '殖耐論貴称千歴史募容噂壱胞鳴表雑' + 
        '職妹氏踊停罪甘健焼払侵頃愛便田舎' + 
        '孤晩清際領評課勤謝才偉誤価欠寄忙' + 
        '従五送周頑労植施販台度嫌諸習緒誘' + 
        '仮借輩席戒弟珍酔試騎霜鉱裕票券専' + 
        '祖惰偶怠罰熟牲燃犠快劇拠厄抵適程' + 
        '繰腹橋白処匹杯暑坊週秀看軽幕和平' + 
        '王姫庭観航横帳丘亭財律布規謀積刻' + 
        '陥類'
    )
    fe_table[0xDE] = "X"; //e.g. cost for inn
    
    for (let i = 0; i < tableString.length; i++) {
        fe_table[i] = tableString[i];
    }
    
    return fe_table;
}


