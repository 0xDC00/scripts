// ==UserScript==
// @name         [PCSG00410] Nekketsu Inou Bukatsu-tan Trigger Kiss
// @version      0.1
// @author       GO123
// @description  Vita3k
// *Design Factory Co., Ltd. & Otomate
// ==/UserScript==
trans.replace(function (s) {
	return s
		.replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, '')
		.replace(/#Pos\[[\s\S]*?\]/g, '')
		.replaceAll("#n", " ")
		.replaceAll("④", "!?")
		.replaceAll("②", "!!")
		.replaceAll("⑥", "。")
		.replaceAll("⑪", "【")
		.replaceAll("⑫", "】")
		.replaceAll("⑤", "、")
		.replaceAll("①", "・・・")

		;
});
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, '200++');
setHook({
	0x8004e44a: mainHandler.bind_(null, 0, 0, "dialogue"),
});
function handler(regs, index, offset, hookname) {
	const reg = regs[index];
	const address = regs[index].value.add(offset);

	console.log("onEnter: " + hookname);
	//console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

	let s = address.readShiftJisString();
	return s;
}
