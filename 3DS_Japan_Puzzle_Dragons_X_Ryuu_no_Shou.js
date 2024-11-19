// ==UserScript==
// @name         [0004000000182E00] Puzzle & Dragons X: Ryuu no Shou (Japan)
// @version      0.1
// @author       [Gilfar]
// @description  Citra
// KnownIssue: player name replaced with プレーヤー, item acquisition message has only item name
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 0), '200+'); // join 200ms

setHook({
    0x365fd0: mainHandler, // dialouge only
});

function handler(regs, index) {
    const address = regs[index].value;

    console.log('onEnter');
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
    let s = [], c;
    while ((c = address.readU8()) !== 0x00) {
      if (c == 0x0e) { //special references
        address = address.add(1);
        let type = address.readU8();
        if (type == 0x01) { //player name
            address = address.add(6);
            // replace with プレーヤー as we do not have name
            s = s.concat([0xE3, 0x83, 0x97, 0xE3, 0x83, 0xAC, 0xE3, 0x83, 0xBC, 0xE3, 0x83, 0xA4, 0xE3, 0x83, 0xBC])
        } else {
            address = address.add(2);
            type = address.readU8();
            if (type != 0x00) { //color
                address = address.add(8);
            } else { //furigana
                address = address.add(2);
                let byteCount = address.readU16();
                address = address.add(2);
                let c = address.readU16();
                address = address.add(2);
                let charByteCount = address.readU16();
                address = address.add(charByteCount + 2);
            }
        }
      } else {
        s.push(c);
        address = address.add(1);
      }
    }
    return new TextDecoder().decode(new Uint8Array(s));
}