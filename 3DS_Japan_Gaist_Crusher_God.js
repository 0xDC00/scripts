// ==UserScript==
// @name         [000400000012AD00] Gaist Crusher God (Japan)
// @version      rev1
// @author       [Gilfar]
// @description  Citra
// KnownIssue: movie text extraction is not synced to their appearance
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 1), '200+'); // join 200ms

setHook({
    0x230a74: mainHandler, // dialouge only
    0x2303ec: mainHandler, // movies only 60fps ~10ms per call
});

function handler(regs, index) {
    const address = regs[index].value;

    //console.log('onEnter');
    //console.log(hexdump(address, { header: false, ansi: false, length: 0xA00 }));

    /* processString */
    let s = readString(address);

    // filters
    s = s
        .replace(/(\r\n)+/g, '　') // page break
        ;

    return s;
}

function readString(address) {
    let s = '', c;
    let furigana = false;
    while ((c = address.readU16()) !== 0x00) {
      if (c == 0x01) { //Color block
        address = address.add(4);
      } else if (c == 0x02) { //Start of Text
        address = address.add(2);
      } else if (c == 0x03) { //End  of Text
        address = address.add(2);
        furigana = true
      } else if (c == 0x04) { //End of Transmission
        address = address.add(2);
        furigana = false
      } else if (furigana === true) { //furigana
        address = address.add(2);
      } else {
        s += address.readUtf16String(1)
        address = address.add(2);
      }
    }
    return s
}