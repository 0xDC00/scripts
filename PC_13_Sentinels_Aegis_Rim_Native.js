// ==UserScript==
// @name         13 Sentinels: Aegis Rim - native PC port (Japan 1.04)
// @version      0.1.0
// @author       kanjieater
// @description  Standalone Agent; saulob PC port v0.1.0 / CUSA10602 01.04 only
// ==/UserScript==
'use strict';

// Captures the original game's UTF-8 text setters, not rendered glyphs/OCR.
// Guest ABI is System V AMD64, even on Windows: text is in RSI (not args[1]).
// Independent of GSM. No game files, saves, input mappings or settings are written.
// Live verification so far: new-game Japanese introduction/narration. Combat and all UI channels are unverified.
const profile = {
  "entryRva": 3915360,
  "entryPattern": "55 48 89 e5 41 57 41 56 53 50 44 8b 37 48 89 f3 4c 8d 7f 08 e8 67 05 2e 00 48 89 df e8 6f 05 2e 00 48 8d 3d 88 01 2e 00 e8 63 05 2e 00 e8 8e 41",
  "ebootSha256": "3bcaeac50607e4ded31b5123a4170f646bdb0441a070fe9ce6757dfd60c4fbcb",
  "guards": [
    {
      "rva": 3915360,
      "signature": "55 48 89 e5 41 57 41 56 53 50 44 8b 37 48 89 f3 4c 8d 7f 08 e8 67 05 2e 00 48 89 df e8 6f 05 2e 00 48 8d 3d 88 01 2e 00 e8 63 05 2e 00 e8 8e 41"
    },
    {
      "rva": 23521216,
      "signature": "55 48 89 e5 48 89 f8 24 f0 c5 f1 ef c9 c5 f9 6f 10 48 83 c0 10 c5 e9 74"
    },
    {
      "rva": 23983344,
      "signature": "55 48 89 e5 40 f6 c7 07 74 14 8a 07 48 ff c7 8a 16 48 ff c6 84 c0 74 5e"
    },
    {
      "rva": 5922880,
      "signature": "55 48 89 e5 41 57 41 56 41 55 41 54 53 50 49 89 f4 49 89 fe 48 85 f6 74"
    },
    {
      "rva": 5923136,
      "signature": "55 48 89 e5 41 57 41 56 41 55 41 54 53 50 49 89 fc 48 85 f6 74 1c 31 db"
    }
  ],
  "sites": [
    {
      "rva": 5922880,
      "signature": "55 48 89 e5 41 57 41 56 41 55 41 54 53 50 49 89 f4 49 89 fe 48 85 f6 74"
    },
    {
      "rva": 5923136,
      "signature": "55 48 89 e5 41 57 41 56 41 55 41 54 53 50 49 89 fc 48 85 f6 74 1c 31 db"
    }
  ]
};
const main = Process.mainModule || Process.enumerateModules()[0];
if (Process.arch !== 'x64' || main.name.toLowerCase() !== '13_sentinels_aegis_rim.exe') {
    throw new Error('Select the native 13_sentinels_aegis_rim.exe process (x64).');
}
const output = trans.send(function (text) { return text; }, '200+');
const recent = new Map();
let timer = null;
let installed = false;
let failures = 0;
const started = Date.now();
function matches(address, signature) {
    const expected = signature.split(' ');
    const actual = new Uint8Array(address.readByteArray(expected.length));
    return expected.every((v, i) => v === '??' || actual[i] === parseInt(v, 16));
}
function validate(base) {
    return profile.guards.every(g => matches(base.add(g.rva), g.signature));
}
function boundedUtf8(pointer) {
    if (pointer.isNull()) return null;
    const range = Process.findRangeByAddress(pointer);
    if (!range || range.protection[0] !== 'r') return null;
    const length = Math.min(4096, range.base.add(range.size).sub(pointer).toUInt32());
    const data = new Uint8Array(pointer.readByteArray(length));
    const end = data.indexOf(0);
    if (end <= 0) return null;
    return pointer.readUtf8String(end);
}
function attach(base) {
    if (installed) return;
    if (!validate(base)) throw new Error('Unsupported game code: expected Japanese CUSA10602 01.04 fingerprints.');
    const handles = [];
    try {
        for (const site of profile.sites) {
            handles.push(Interceptor.attach(base.add(site.rva), {
                onEnter() {
                    try {
                        const text = boundedUtf8(this.context.rsi);
                        if (!text || !/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)) return;
                        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)) return;
                        const now = Date.now();
                        if (recent.has(text) && now - recent.get(text) < 500) return;
                        if (recent.size >= 256) recent.clear();
                        recent.set(text, now);
                        output(text);
                    } catch (_) { /* Ignore invalid/transient/non-UTF8 pointers. */ }
                }
            }));
        }
    } catch (error) {
        handles.forEach(h => h.detach());
        throw error;
    }
    installed = true;
    if (timer !== null) clearInterval(timer);
    console.log('[13 Sentinels] Attached: CUSA10602 01.04, guest image ' + base + '.');
}
function poll() {
    if (installed) return;
    if (Date.now() - started > 120000) {
        clearInterval(timer);
        console.error('[13 Sentinels] No supported guest image found. Start PLAY, or check the game version.');
        return;
    }
    try {
        const ranges = Process.enumerateRanges({ protection: 'r-x', coalesce: false });
        for (const range of ranges) {
            if (range.size < 4096 || Process.findModuleByAddress(range.base) !== null) continue;
            for (const hit of Memory.scanSync(range.base, range.size, profile.entryPattern)) {
                const base = hit.address.sub(profile.entryRva);
                if (validate(base)) { attach(base); return; }
            }
        }
    } catch (error) {
        if (++failures <= 3) console.warn('[13 Sentinels] Waiting for guest memory: ' + error);
    }
}
console.log('[13 Sentinels] Waiting for the Japanese 1.04 guest image; this is not the Switch/Yuzu hook.');
timer = setInterval(poll, 1000);
poll();
