// ==UserScript==
// @name         Kyokkou no Marriage
// @version      
// @author       C-G
// @description  
// * ensemble
// * Unity (JIT)
//
// ==/UserScript==

const Mono = require('./libMono.js');
const handler = trans.send((s) => s, '200+');

let textBuffer = '';
let isInDialogue = false;


console.log(`
Unsupported yet:
* "Horror Scenes" with text that fills the screen (Might be unhookable)

Known issue:
* Non-dialogue lines with multiple termination characters get sent separately.
    
`);

Mono.setHook('', 'CatSystem.NovelLayer', 'SetText', -1, {
    onEnter(args) {
        if (!args[1]) return;
        
        const text = args[1]
            .readMonoString()
            .replace(/\[([^\]]+)\/[^\]]+\]/g, '$1')
            .replace(/\r?\n|\r/g, '')
            .trim();
        
        // Prevent Backlog from being sent
        if (/;|\\n/.test(text)) return;
        
        textBuffer += text;

        // Check for both types of dialogue markers       
        if (textBuffer.includes('「') || textBuffer.includes('（')) {
            isInDialogue = true;
            const startIndex = textBuffer.includes('「') ? textBuffer.indexOf('「') : textBuffer.indexOf('（');
            textBuffer = textBuffer.substring(startIndex);
        }

        // Send text when dialogue ends or at termination characters
        if ((isInDialogue && (text.endsWith('」') || text.endsWith('）'))) || 
            text.includes('\\p') || 
            (!isInDialogue && /[。！？…―]$/.test(textBuffer))) {
            
            handler(textBuffer.replace(/\\p(c)?/g, ''));
            textBuffer = '';
            isInDialogue = false;
        }
    }
});