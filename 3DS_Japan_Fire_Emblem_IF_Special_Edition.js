// ==UserScript==
// @name         [000400000012DE00] Fire Emblem: IF Special
// @version      1.1
// @author       [Daisouji]
// @description  Citra
// ==/UserScript==
const { setHook } = require("./libCitra.js");

const mainHandler = trans.send(handler.bind_(null, 1), '200+'); // join 200ms

setHook({ 
      // 1.0 0x190af4: mainHandler, // dialogue only
     0x190ff4:mainHandler
});

function handler(regs, index) {
    const address = regs[index].value;

    //console.log('onEnter');

    /* processString */
    let s = address.readUtf16String();
    
    
    if(s.includes('$')){
    let lastindex = s.indexOf('$')
    s = s.substring(0,lastindex);
    }


    s=s
    .replaceAll("_"," ")
 

    return s;
}

//大丈夫か、カムイ_ぼんやりしていたようだが
