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
const mainHandler1 = trans.send(handler, '200+');
setHook({

	0x8004e44a: mainHandler.bind_(null, 0, 0, "dialogue"),
	0x8000dd5a: mainHandler.bind_(null, 2, 0, "name"),
	0x8002f90a: mainHandler.bind_(null, 0, 0, "index"),
	0x8004fab6: mainHandler1.bind_(null, 0, 0, "choices"),

	// the index hook is a hook for drop-down text in red, it will only extract the text once you exit the box during playthrough.
	// However it can't extract the text from the index section in the title screen.
});
function handler(regs, index, offset, hookname) {
	const reg = regs[index];

	const address = regs[index].value.add(offset);

	if (reg.vm == 0) return null; // filter janky code

	console.log("onEnter: " + hookname);

	console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

	if (hookname === "index" || hookname === "choices") { // both "index" and "choices" hooks requiers the add() function to read 
		// from different location than the main text . 
		let s = address.add(0x14).readShiftJisString();
		return s;
	}
	else if (hookname === "name") { //add brackets to name e.g.【梓馬】


		let s = "【" + address.readShiftJisString() + "】";

		return s;
	}

	else {
		let s = address.readShiftJisString();

		return s;

	}

}
