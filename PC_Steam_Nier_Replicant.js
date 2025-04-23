// ==UserScript==
// @name         NieR Replicant
// @version      1.0
// @author       Pringles
// @description  Steam, currently does not support diary loading pages, ln sections should work.
// Only works when game is set to Japanese text.
//
// https://store.steampowered.com/app/1113560/NieR_Replicant_ver122474487139/
// ==/UserScript==
const baseModule = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');
const CONFIG = {
    MAX_SCAN: 1024,
    MIN_LENGTH: 2,
    PATTERN: '88 02 41 0FB7 C2',
    DEBOUNCE_MS: 200
};

let lastText = "", lastSent = "", debounceTimer = null;

console.log("Does not support diary loading pages.");
console.warn("Only works when game is in Japanese.");

function findJapaneseStart(addr) {
    for (let i = 0; i < CONFIG.MAX_SCAN; i++) {
        const byte = addr.add(i).readU8();
        if ((byte >= 0xE2) || (byte >= 0x20 && byte <= 0x7E)) {
            return addr.add(i);
        }
    }
    return null;
}

function sendText(text) {
    if (text === lastSent || text.length < CONFIG.MIN_LENGTH || lastSent.includes(text)) return;
    
    clearTimeout(debounceTimer);
    
    debounceTimer = setTimeout(() => {
        lastSent = text;
        handler(text);
    }, CONFIG.DEBOUNCE_MS);
}

(function () {
    const matches = Memory.scanSync(baseModule.base, baseModule.size, CONFIG.PATTERN);
    if (matches.length === 0) return console.error('[NieR Hook] Pattern not found!');

    let baseAddr = ptr(0);
    Interceptor.attach(matches[0].address, {
        onEnter(args) {
            const addr = this.context.rdx;
            if (baseAddr.equals(ptr(0)) || addr.compare(baseAddr) < 0) baseAddr = addr;
        }
    });

    setInterval(() => {
        if (baseAddr.equals(ptr(0))) return;

        const jpStart = findJapaneseStart(baseAddr);

        baseAddr = ptr(0);

        if (!jpStart) return;

        try {
            const text = jpStart.readUtf8String()?.trimEnd();
            if (text && text !== lastText) {
                lastText = text;
                sendText(text);
            }

            let finalCharPointer = jpStart.add(Buffer.byteLength(text, "utf8") - 1);
            const value = finalCharPointer.readU8();
            if (value === 0x0a) { // currently does not do anything yet.
                console.debug("Finished reading sentence");
            }
        } catch (e) {
            if (!e.message.includes('decode byte')) console.error('[NieR Hook] Error reading string:', e);
        }
    }, 50);
})();