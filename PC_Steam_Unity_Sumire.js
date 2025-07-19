// ==UserScript==
// @name         Sumire
// @version      0.1
// @author       spongerobertosquarepantalones
// @description  Steam
// 
// https://store.steampowered.com/app/1335230/Sumire/
// ==/UserScript==


/*
 * The game uses Unity, so we can hook into the Mono methods.
 * To find the names of the classes and methods, I used the online Il2CppDumper tool at https://il2cppdumper.com/the-dumper-tool
 */
const Mono = require('./libMono.js');
const {
    setHook,
} = Mono;
const handler = trans.send(s => s, '200+');


// Regular dialogue
[
    ['OverlaySpeechBubble', 'Initialize'], // VN-style dialogue    
    ['DialogueView', 'Initialize'], // overhead speech bubbles        
].forEach(([className, methodName]) => {
    Mono.setHook('', className, methodName, -1, {
        onEnter(args) {
            let text = args[1].readMonoString()            
            handler(cleanText(text));
        },        
    });
});

// Windows where you need to select an option
Mono.setHook('', 'DialogueManager', 'GetStringFromLineID', -1, {
    onLeave(retVal) {
        let text = retVal.readMonoString();
        if (!textHasModifier(text)) {
            // some text has a rendering instruction at the end, like "%smalltext"
            // but these texts also appear in the above dialogueview filters without the modifiers, so we can just filter them out here            
            handler(cleanText(text));
        }
    }
});

function textHasModifier(text) {
    return /%[a-zA-Z]+\s*$/.test(text);
}

function cleanText(text) {
    return text
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/[A-Z]+:\s*/g, '') // remove prefixes like "CHOICEWINDOW: <text>"
        ;
}
