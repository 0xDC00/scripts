// ==UserScript==
// @name         The House in Fata Morgana
// @version      1.35
// @author       Musi
// @description  Steam
// * NOVECT
//
// https://store.steampowered.com/app/303310/The_House_in_Fata_Morgana/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
console.warn('[Known Issue] Some inner dialogue is picked up even when not displayed in game. Recommend ignoring this for spoiler reasons.');
(function () {
    const mainHandler = trans.send(handler, '250+');
    attach('DialogueHook', 'E8 33 DC E1 FF', 'edx');
    
    let lastText = '';
    let sentenceBuffer = '';
    
    function handler(text) {
        return text;
    }
    
    function cleanText(text) {
        return text
            .replace(/\[.*?\]/g, '') // remove [tags]
            .replace(/@.*$/gm, '') // remove @ commands
            .trim();
    }
    
    function endsWithPunctuation(text) {
        // check if text ends with punctuation
        return /[。！？…・）]$/.test(text);
    }
    
    function hasJapaneseText(text) {
        // check if text contains Japanese characters
        return /[\u3040-\u30FF\u4E00-\u9FAF]/.test(text);
    }
    
    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        const address = results[0].address;
        console.log(`[${name}] Found hook at ${address}`);
        Interceptor.attach(address, function (args) {
            const basePtr = this.context[register];
            
            // early return if pointer is null
            if (!basePtr || basePtr.isNull()) {
                return;
            }
            
            const text = basePtr.readUtf16String();
            
            // early return if no text
            if (!text || text.length === 0) {
                return;
            }
            
            const cleaned = cleanText(text);
            
            // only output japanese characters and no duplicates
            if (cleaned.length > 0 && hasJapaneseText(cleaned) && cleaned !== lastText) {
                lastText = cleaned;
                
                if (sentenceBuffer.length > 0) {
                    sentenceBuffer += cleaned;
                } else {
                    sentenceBuffer = cleaned;
                }
                
                if (endsWithPunctuation(cleaned)) {
                    mainHandler('\n' + sentenceBuffer + '\n');
                    sentenceBuffer = '';
                }
            }
        });
    }
})();
