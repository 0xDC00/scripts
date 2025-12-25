// ==UserScript==
// @name         Inazuma Eleven: Victory Road
// @version      1.5.1_0.19_150
// @author       [Sorachi00]
// @description  Steam
// * Level-5
//
// https://store.steampowered.com/app/2799860/INAZUMA_ELEVEN_Heroes_Victory_Road/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

(function () {
    const seenTexts = new Map();
    let cachedOffset = -1; 
    
    attach('dialogue_box', '48 8B CB E8 ?? ?? ?? ?? B0 01', 'r9');
    
    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);
        
        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
        
        let address;
        if (results.length === 1) {
            address = results[0].address;
        } else {
            const targetOffset = 0xFBEB5D;
            address = results.reduce((closest, result) => {
                const currentDiff = Math.abs(result.address.sub(__e.base).toInt32() - targetOffset);
                const closestDiff = Math.abs(closest.sub(__e.base).toInt32() - targetOffset);
                return currentDiff < closestDiff ? result.address : closest;
            }, results[0].address);
        }
        
        console.log(`[${name}] Hook at ${address} (offset: ${address.sub(__e.base)})`);
        
        Interceptor.attach(address, function () {
            const reg = this.context[register];
            if (!reg || reg.isNull()) return;
            
            const text = extractUtf8Fast(reg);
            
            if (text) {
                const now = Date.now();
                const lastSeen = seenTexts.get(text) || 0;
                
                if (now - lastSeen > 3000) {
                    seenTexts.set(text, now);
                    handler(text);
                }
            }
        });
    }
    
    function extractUtf8Fast(ptr) {
        if (cachedOffset >= 0) {
            try {
                const s = ptr.add(cachedOffset).readUtf8String();
                if (s && s.length > 2 && /[ぁ-んァ-ン一-龯]/.test(s)) {
                    return s;
                }
            } catch {}
        }
        
        const hotspots = [0x250, 0x240, 0x260, 0x230, 0x270, 0x220, 0x280];
        for (const off of hotspots) {
            try {
                const s = ptr.add(off).readUtf8String();
                if (s && s.length > 2 && /[ぁ-んァ-ン一-龯]/.test(s)) {
                    cachedOffset = off; 
                    return s;
                }
            } catch {}
        }
        
        for (let off = 0; off < 0x400; off += 16) {
            if (hotspots.includes(off)) continue;
            
            try {
                const s = ptr.add(off).readUtf8String();
                if (s && s.length > 2 && /[ぁ-んァ-ン一-龯]/.test(s)) {
                    cachedOffset = off;
                    return s;
                }
            } catch {}
        }
        
        return null;
    }
})();