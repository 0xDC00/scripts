// ==UserScript==
// @name         [PCSG00912]  Un:Birthday Song ~Ai o Utau Shinigami~
// @version      0.1
// @author       GO123 (huge thanks to koukdw For the NVL hook and other edits )
// @description  Vita3k
// *honeybee
// ==/UserScript==
//------------------------------------------------
const { setHook } = require("./libVita3k.js");

const encoder = new TextEncoder("shift_jis");

const nvlHandler = trans.send(nvl_handler, -200); // join 200ms
const mainHandler = trans.send(handler, '200++');

setHook({

    // 0x800379ae: nvlHandler.bind_(null, 3, 0x0, "dialogue NVL"),
    //  0x80004b52: mainHandler.bind_(null, 3, 0x5, "dialogue"),
    0x80038538: nvlHandler.bind_(null, 1, 0x0, "dialogue NVL"),
    0x80033d66: mainHandler.bind_(null, 3, 0x4, "dialogue"),
});

function nvl_handler(regs, index, offset, hookname) {
    let address = regs[index].value;
    let final_string = ""
    const pattern = '47 ff ff'
    const results = Memory.scanSync(address, 0x50, pattern);
    if (results.length === 0) {
        return;
    }
    address = results[0].address.add(5);

    while (true) {

        let text = address.readShiftJisString();
        final_string += text;
        address = address.add(encoder.encode(text).byteLength + 1);



        let bytes = [address.readU8(), address.add(1).readU8(), address.add(2).readU8()];
        //console.log(hexdump(address, { header: false, ansi: false }))
        if (!(bytes[0] == 0x48 && bytes[1] == 0xFF && bytes[2] == 0xFF)) break;
        address = address.add(3);
        bytes = [address.readU8(), address.add(1).readU8(), address.add(2).readU8()];
        if (!(bytes[0] == 0x47 && bytes[1] == 0xFF && bytes[2] == 0xFF)) break;

        address = address.add(5);

    }

    return final_string;


}

function handler(regs, index, offset, hookname) {
    let address = regs[index].value;
    let s = address.add(offset).readShiftJisString();
    return s
        .replace(/G��./g, "")
        .replace(/G��/g, "")
        .replaceAll(/%N/g, '')


        ;


}
