// ==UserScript==
// @name         [PCSG00172]  Kajiri Kamui Kagura: Akebono no Hikari
// @version      0.1
// @author       GO123
// @description  Vita3k
// *light
// ==/UserScript==
trans.replace(function (s) {
    return s
        .replace(/Mﾚ      　ｰ_Mﾚ  ���/g, '')
		.replace(/u_/g, '')
		.replace("ata/data4.dat", '')
		.replace(":data/data4.dat", '')
		.replace(/@/g,"")
		.replace(/�/g,"")
		.replace(/∥pp0:d/g,"")
		.replace(/app0:d:d/g,"")
		
        

        ;
}); 
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200++"); // join 200ms

setHook({
0x810a2486: mainHandler.bind_(null, 0, 0, "dialogue"),

   
});

function handler(regs, index, offset, hookname) {
  const  address = regs[index].value.add(offset);
	

    console.log("onEnter: " + hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readShiftJisString();


    return s;
}
