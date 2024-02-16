// ==UserScript==
// @name         Shin Megami Tensei III Nocturne HD Remaster
// @version      
// @author       [Owlie] (Special thanks to Koukdw)
// @description  Steam
// * ATLUS | SEGA
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/1413480/Shin_Megami_Tensei_III_Nocturne_HD_Remaster/
// ==/UserScript==
const Mono = require('./libMono.js');

Mono.setHook('', 'Wordwrap', 'Convert', 2, {
    onEnter(args) {
       let text = args[0].readMonoString().replace(/<[^>]*>/g, '');
        
        // Call the swapHandler to handle the text
        swapHandler(text);
    }
});

// Swap handler to handle the swapping logic
let text = [];
let timerSwap;
function swapHandler(s) {
    text.unshift(s);
    clearTimeout(timerSwap);
    timerSwap = setTimeout(() => {
        const joinedText = [...text].join('\r\n');
        trans.send(joinedText);
        text = []; // Reset 
    }, 300);
}

