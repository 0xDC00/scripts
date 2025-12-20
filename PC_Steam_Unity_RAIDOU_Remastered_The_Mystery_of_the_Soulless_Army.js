// ==UserScript==
// @name         RAIDOU Remastered: The Mystery of the Soulless Army
// @version      
// @author       Koukdw
// @description  Steam
// * ATLUS | SEGA
// * Unity (IL2CPP)
// Basically SMT III Nocturne HD Remaster script slightly modified (Wordwrap class is in a namespace now and Convert take 4 arguments instead of 2)
// https://store.steampowered.com/app/2288350/RAIDOU_Remastered_The_Mystery_of_the_Soulless_Army/
// ==/UserScript==
const Mono = require('./libMono.js');

Mono.setHook('', 'Project.Wordwrap', 'Convert', -1, {
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

