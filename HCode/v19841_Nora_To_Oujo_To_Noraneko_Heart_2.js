const gameVer = '1.0.1';
trans.replace(function (s) {
	return s
		.replace(/反田ノラ/g, 'Handa Nora')
		.replace(/反田/g, 'Handa')
		.replace(/ノラ/g, 'Nora')
		.replace(/ノラさん/g, 'Nora-san')
		.replace(/ユウラシア・オブ・エンド/g, 'Eurasia of End')
		.replace(/ユウラシア/g, 'Eurasia')
		.replace(/オブ/g, 'of')
		.replace(/エンド/g, 'End')
		.replace(/アイリス・ディセンバー・アンクライ/g, 'Iris December Uncry')
		.replace(/アイリス/g, 'Iris')
		.replace(/ディセンバ/g, 'December')
		.replace(/アンクライ/g, 'Uncry')
		.replace(/ルーシア・オブ・エンド/g, 'Lucia of End')
		.replace(/ルーシア/g, 'Lucia')
		.replace(/ノエル・ザ・ネクストシーズン/g, 'Noel the next season')
		.replace(/ノエル/g, 'Noel')
		.replace(/ザ/g, 'the')
		.replace(/ネクストシーズン/g, 'Next Season')
		.replace(/高田ノブチナ/g, 'Takada Nobuchina')
		.replace(/高田/g, 'Takadan')
		.replace(/ノブチナ/g, 'Nobuchina')
		.replace(/夕莉シャチ/g, 'Yuuri Shachi')
		.replace(/夕莉/g, 'Yuuri')
		.replace(/シャチ/g, 'Shachi')
		.replace(/オルカ/g, 'Orca')
})

const { setHook } = require('../PC_HCode.js');

setHook('/HS4@2DF80:', {
    threads: {
        ':0x2df80': true,
		':$0x2906b': true,
    }
});
