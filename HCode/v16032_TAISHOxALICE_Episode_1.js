// ==UserScript==
// @name         TAISHO x ALICE Episode 1
// @version      
// @author       [DC]
// @description  JP only, Steam (outdated?; the frist hcode script)
// * 2XT - Primula Adventure Engine (4.4.1.1)
// ==/UserScript==

const { setHook } = require('../PC_HCode.js');

setHook('/HS8@6E300:PJADVJP.bin', {
    // Filter
    blacklist: true, // bool
    threads: {
        //':$0x15618': true, // name
        //':$0x15667': true, // dialouge
        ':$0x6dcad': true, // ruby
    },

    // Linker
    join: '500+'
});

/* Replacer */
const patt = /\\\{([^\|]+).([^}]+)./g;
trans.replace((s) => {
    // が\{挫|くじ}け
    // \{text|rubi}
    const rubis = s.matchAll(patt);
    // print rubi
    for (const rubi of rubis) {
        console.log('rubi ' + rubi[2]);
        console.log('rube ' + rubi[1]);
    }
    // remove rubi
    s = s.replace(patt, '$1');

    s = s.replaceAll('\\n', ' ');

    return s;
});