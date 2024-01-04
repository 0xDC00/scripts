// ==UserScript==
// @name         [010079C017B98000] Cupid Parasite -Sweet & Spicy Darling-
// @version      1.0.0
// @author       [zooo]
// @description  Yuzu
// * Otomate & Idea Factory Co., Ltd.
// ==/UserScript==

const gameVer = '1.0.0';

const { setHook } = require('./libYuzu.js');
const mainHandler = trans.send(handler, '200+');

setHook({
    '1.0.0': {
        [0x801a1bf0 - 0x80004000]: mainHandler, // choice

    }
}[globalThis.gameVer = globalThis.gameVer ?? gameVer]);

function handler(regs) {
    const address = regs[0].value;
    console.log('onEnter');

    /* processString */
    let s = address.readUtf32StringLE()
    .replace(/【SW】/g,'') 
    .replace(/【SP】/g,'') 
        ;
    return s;
}

globalThis._FIXED_DCODE_ = '$utf-32,|100|00000000,458B6405004589E44D89A7B8000000488B44243041BC1C0000004C01E0448B6424404989C249C1EA270F85A80000004589640500488B44245041BC2C000000'; // dialogue

// globalThis.decode = function(buffer) {
//  return _decode(buffer);
// }

globalThis.filters = function filters(s) {
  s = _filters(s);
  const array=['#T1'];

array.forEach(e=>{

s=s.replaceAll(e,'')


});
    return s
  .replace(/(#T2).+/g,'')
  .replace(/(#T0)/g,'')      
  .replaceAll('#C(TR,0xff0000ff)','')
  .replaceAll(/[\s]/g,'');


        ;
}


require('_ExecutionWatch.js');



