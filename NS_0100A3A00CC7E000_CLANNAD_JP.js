// ==UserScript==
// @name         [0100A3A00CC7E000] CLANNAD
// @version      1.0.0
// @author       [DC]
// @description  Yuzu
// * PROTOTYPE
// * 
//
// Warnning: Japanese
// ==/UserScript==
trans.replace(function(str) {
    const s = str.replace("Tomoya", "朋也").replace("Okazaki", "岡崎")
    const splited = s.split('\n');
    if (splited.length % 2 === 0) {
        const N = splited.length / 2;
        return splited.slice(0, N).join('\r\n');
    }
    return s;
});

require('./NS_0100A3A00CC7E000_CLANNAD.js');