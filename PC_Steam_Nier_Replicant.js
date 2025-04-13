// ==UserScript==
// @name         NieR Replicant Dialogue Hook (Simplified)
// @version      1.0
// @author       Pringles
// @description  Steam, might not work with LN section
//
// https://store.steampowered.com/app/1113560/NieR_Replicant_ver122474487139/
// ==/UserScript==

const baseModule = Process.enumerateModules()[0];
const handler = trans.send(s => s, '200+');
const decoder = new TextDecoder('utf-8');

const CONFIG = {
    MAX_SCAN: 1024,
    MIN_LENGTH: 2,
    JAPANESE_THRESHOLD: 0xE3,
    PATTERN: '88 02 41 0FB7 C2',
    DEBOUNCE_MS: 50
};

let lastText = "";
let lastSent = "";
let debounceTimer = null;

console.warn("This script is a mess, and the first script I ever made, may or may not be stable.")
console.log("Currently only logs dialog boxes.")


function findJapaneseStart(addr) {
    for (let i = 0; i < CONFIG.MAX_SCAN; i++) {
        if (Memory.readU8(addr.add(i)) >= CONFIG.JAPANESE_THRESHOLD) {
            return addr.add(i);
        }
    }
    return null;
}

function readString(addr) {
    let len = 0;
    while (len < CONFIG.MAX_SCAN && Memory.readU8(addr.add(len)) !== 0) len++;
    if (len === 0) return null;
    return decoder.decode(Memory.readByteArray(addr, len)).trim();
}

function sendText(text) {
    if (text === lastSent || text.length < CONFIG.MIN_LENGTH || lastSent.includes(text)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        lastSent = text;
        handler(text);
    }, CONFIG.DEBOUNCE_MS);
}

// Main hook logic
(function () {
    const matches = Memory.scanSync(baseModule.base, baseModule.size, CONFIG.PATTERN);
    if (matches.length === 0) return console.error('[NieR Hook] Pattern not found!');

    console.log('[NieR Hook] Hooking at', matches[0].address);

    let baseAddr = ptr(0);

    Interceptor.attach(matches[0].address, {
        onEnter(args) {
            const addr = this.context.rdx;

            if (baseAddr.equals(ptr(0)) || addr.compare(baseAddr) < 0) {
                baseAddr = addr;
            }

            const jpStart = findJapaneseStart(baseAddr);
            if (!jpStart) return;

            const text = readString(jpStart);
            if (text && text !== lastText) {
                lastText = text;
                sendText(text);
            }
        }
    });
})();
