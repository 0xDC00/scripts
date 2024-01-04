// ==UserScript==
// @name         [0100F7E00DFC8000] Cupid Parasite
// @version      1.0.1
// @author       [zooo]
// @description  Yuzu
// * Otomate
// ==/UserScript==

const gameVer = '1.0.1';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.1': {
        [0x80169df0 - 0x80004000]: mainHandler, // choice

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    console.log('onEnter');

    /* processString */
    let s = address.readUtf32StringLE()
        .replaceAll('\n', ' ') // Single line
        ;
    return s;
}

globalThis._FIXED_DCODE_ = '$utf-32,|100|00000000,458B6405004589E44D89A7B8000000498B87A80000004531E44C01E04989C349C1EB270F85C70000004D8B6405004D896750488B44243041BB1C000000'; // dialogue

// globalThis.decode = function(buffer) {
//  return _decode(buffer);
// }


globalThis.filters = function filters(s) {
  s = _filters(s);
  s=s.replaceAll('#C(TR,0xff0000ff)','');
  s=s.replaceAll('#KW','')
    ;
  return s;
}

require('_ExecutionWatch.js');