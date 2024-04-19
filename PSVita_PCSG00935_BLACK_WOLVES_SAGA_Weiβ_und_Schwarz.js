// ==UserScript==
// @name         [PCSG00935] BLACK WOLVES SAGA  -Weiβ und Schwarz-
// @version      0.1
// @author       Koukdw
// @description  Vita3k
// * Otomate / Rejet
// * Idea Factory Co., Ltd.
// ==/UserScript==
const { setHook } = require("./libVita3k.js");

const mainHandler = trans.send(handler, "200+"); // join 200ms

setHook({
    // 0x8004ed22: mainHandler.bind_(null, 0, 0, "name"),
    // 0x8006d202: mainHandler.bind_(null, 1, 2, "text"),
    0x800581a2: mainHandler.bind_(null, 0, 0, "text"),
});

function handler(regs, index, offset, hookname) {
    const address = regs[index].value.add(offset);

    console.log("onEnter", hookname);
    console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    let s = address.readUtf8String();

    const rubis = s.matchAll(/(#Ruby\[)([^,]+).([^\]]+)./g);
    for (const rubi of rubis) {
        console.log("rubi", rubi[3]);
        console.log("rube", rubi[2]);
    }
    // remove rubi
    s = s.replace(/(#Ruby\[)([^,]+).([^\]]+)./g, "$2");

    s = s
        .replace(/(#n)+/g, " ") // Single line
        .replace(/(#[A-Za-z]+\[(\d*[.])?\d+\])+/g, ""); // Remove controls

    return s;
}
