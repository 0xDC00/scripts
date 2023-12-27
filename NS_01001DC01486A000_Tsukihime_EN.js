// ==UserScript==
// @name         [01001DC01486A000] 月姫 -A piece of blue glass moon-
// @version      1.0.1, 1.0.2
// @author       [DC]
// @description  English Patch: https://github.com/Tsukihimates/Tsukihime-Translation
// * Aniplex (アニプレックス)
// * 
// KnowIssue: Prologue video (missed)
// ==/UserScript==
require('./NS_01001DC01486A000_Tsukihime.js');

trans.replace((s) => {
    let result = '';

    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c >= 0xE000 && c <= 0xe2FF) {
            result += String.fromCharCode((c - 0xE000) % 0x80);
        }
        else {
            result += s[i];
        }
    }

    return result;
}, true);