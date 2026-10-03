// ==UserScript==
// @name         [0100E81024F40000] Le Mirage Mystique
// @version      1.0.1
// @author       GO123
// @description 
// * LicoBiTs
// * BROCCOLI Co., Ltd.
// * Unity
// ==/UserScript==
const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200++');

setHook({
    '1.0.1': {
        [0x81d053fc - 0x80004000]: mainHandler.bind_(null, 0, "text"),
        [0x81bd66c0 - 0x80004000]: mainHandler.bind_(null, 0, "dictionary"),


    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs, index, hookname) {
  const address = regs[index].value;

  console.log("onEnter: " + hookname);
  //console.log(hexdump(address, { header: false, ansi: false, length: 0x50 }));

    /* processString */
    const len = address.add(0x10).readU32() * 2;
    let s = address.add(0x14).readUtf16String(len);
    s = s.replaceAll(/\r?\n/g, "");
    s = s.replaceAll(/\[dic no=\d+ text=([^\]]+)\]/g, '$1');

    return s;
}
