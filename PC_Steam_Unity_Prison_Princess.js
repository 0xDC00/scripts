// ==UserScript==
// @name         Prison Princess
// @version      1.0
// @author       Tom (tomrock645) 
// @description  Steam
// @developer & publisher: qureate
//
// https://store.steampowered.com/app/1151740/Prison_Princess/
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send(s => s, '200+');


let name = "";
let debounceTimer = null; // Timer to handle multiple messages at once
let lastMessage = ""; 

Mono.setHook('', 'Atup.MessageWindowController', 'SetName', 1, {
    onEnter(args) {
        name = args[1].readMonoString();
    }
})

Mono.setHook('', 'Atup.MessageWindowController', 'SetText', 5, {
    onEnter(args) {
        let text = args[2].readMonoString();

        if (text === "テキスト速度のサンプルと、" + "\n" + "オート速度のサンプルです。") // Prevent the preview message in the settings from printing out
            return;

        text = cleanText(text);

        if (name === "") // Narration/you
            lastMessage = text; 

        else // Character
            lastMessage = name + "\n" + text; 

        if(name && text) // Reset the name each time otherwise narration/you prints the last character's name for the first message
            name = ""; 

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(sendDebouncedMessage, 300); // Prevent multiple messages to be displayed at once when loading a save file taking you back mid-conversation
    }
})

function sendDebouncedMessage() {
    if (lastMessage) {
        trans.send(lastMessage);
        lastMessage = ""; 
    }
}

function cleanText(s) {
    return s
        .replace(/<ruby=[^>]*>/g, '') // Remove opening ruby tags
        .replace(/<\/ruby>/g, '') // Remove closing ruby tags
        .replace(/<color=[^>]*>/g, '') // Remove opening <color=...> tags
        .replace(/<\/color>/g, '')
}