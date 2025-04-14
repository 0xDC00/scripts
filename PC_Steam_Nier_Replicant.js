// ==UserScript==
// ==UserScript==
// @name         NieR Replicant Dialogue Hook
// @version      1.0
// @author       Pringles
// @description  Steam, might not work with LN section
//
// https://store.steampowered.com/app/1113560/NieR_Replicant_ver122474487139/
// ==/UserScript==
const baseModule = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');
const CONFIG = {
    MAX_SCAN: 1024,
    MIN_LENGTH: 2,
    JAPANESE_THRESHOLD: 0xE3,
    PATTERN: '88 02 41 0FB7 C2',
    DEBOUNCE_MS: 200
};

let lastText = "", lastSent = "", debounceTimer = null;

function findJapaneseStart(addr) {
    for (let i = 0; i < CONFIG.MAX_SCAN; i++) {
        const byte = Memory.readU8(addr.add(i));
        if ((byte >= CONFIG.JAPANESE_THRESHOLD) || (byte >= 0x20 && byte <= 0x7E)) {
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
        if (!jpStart) return;

        try {
            const text = jpStart.readUtf8String();
            if (text && text !== lastText) {
                lastText = text;
                sendText(text);
            }
        
            baseAddr = ptr(0);
        } catch (e) {
            if (!e.message.includes('decode byte')) console.error('[NieR Hook] Error reading string:', e);
        }
    }, 50);
})();