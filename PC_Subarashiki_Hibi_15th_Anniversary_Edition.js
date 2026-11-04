// ==UserScript==
// @name         Subarashiki Hibi ~Furenzoku Sonzai~ 15th Anniversary Edition
// @version      0.1.0
// @author       Jiro3000
// @description  素晴らしき日々 ～不連続存在～ 15th Anniversary Edition / BGI 1.685.3 (x64)
// ==/UserScript==

// Local draft: live Agent playback has not been confirmed yet.
// Supported BGI.exe SHA-256:
// 993e9803a4335ff752dd7b4fd7b5036c3200c88c74fbde05d29b5123be5bd29c
// Relative addresses handle ASLR; PE and instruction checks reject other builds.

// Includes text-rendered names, choices and menus. Disable for animated messages only.
const CAPTURE_UI = true;
const JOIN_DELAY = 250;
const sendText = trans.send(s => s);
const preparationDepth = new Map();
let pending = [];
let uiSeen = new Set();
let timer = null;
let readErrorReported = false;

(function () {
    if (Process.platform !== 'windows' || Process.arch !== 'x64') {
        throw new Error('Subarashiki Hibi requires the Windows x64 BGI.exe process.');
    }
    const game = Process.findModuleByName('BGI.exe');
    if (game === null) throw new Error('Attach to BGI.exe from the 15th Anniversary Edition.');
    const pe = game.base.add(game.base.add(0x3c).readU32());
    if (game.base.readU16() !== 0x5a4d || pe.readU32() !== 0x4550 ||
        pe.add(4).readU16() !== 0x8664 || pe.add(8).readU32() !== 0x68088ee1 ||
        pe.add(0x50).readU32() !== 0x2aa000) {
        throw new Error('Unsupported BGI.exe build (expected the 15th Anniversary Edition).');
    }

    const hooks = [
        // CProcDspMsgEx::prepare surrounds layout, ruby readings and alignment.
        // Static glyph strings inside it are annotation work, not separate UI text.
        [0x779d0, '48 8b c4 48 89 58 10 48 89 68 18 48 89 70 20 57', {
            onEnter() {
                preparationDepth.set(this.threadId, (preparationDepth.get(this.threadId) || 0) + 1);
            },
            onLeave() {
                const depth = (preparationDepth.get(this.threadId) || 1) - 1;
                if (depth === 0) preparationDepth.delete(this.threadId);
                else preparationDepth.set(this.threadId, depth);
            },
        }],
        // Horizontal layout, immediately after the native embedded-text decoder.
        // RAX points to owned UTF-16 before tags are consumed or glyphs rendered.
        [0x75009, '48 8b f8 48 89 85 38 02 00 00 4c 8b f8 48 89 44 24 68', {
            onEnter() { queue(cleanExtended(this.context.rax.readUtf16String()), false); },
        }],
        // Plain message source setter. This older path consumes CP932 directly.
        [0x72080, '48 8b 01 48 89 51 48 33 d2 48 ff 60 10', {
            onEnter() {
                if (!this.context.rdx.isNull()) {
                    queue(cleanPlain(this.context.rdx.readShiftJisString()), false);
                }
            },
        }],
        // Immediate bitmap text, after the native encoding detector/converter.
        // This covers text-rendered names and choice items without guessing encoding.
        [0x41bf7, '8b 94 24 c8 01 00 00 4c 8b e0 48 89 44 24 40 89 1f', {
            onEnter() {
                if (CAPTURE_UI && !preparationDepth.has(this.threadId)) {
                    queue(cleanPlain(this.context.rax.readUtf16String()), true);
                }
            },
        }],
    ];

    // Check all sites before installing any hooks; never select a guessed address.
    for (const [rva, signature] of hooks) {
        const expected = signature.split(' ').map(s => parseInt(s, 16));
        const actual = new Uint8Array(game.base.add(rva).readByteArray(expected.length));
        if (expected.some((b, i) => actual[i] !== b)) {
            throw new Error('Unsupported hook bytes at RVA 0x' + rva.toString(16));
        }
    }
    const listeners = [];
    try {
        for (const [rva, , callbacks] of hooks) {
            const guarded = {};
            for (const name of Object.keys(callbacks)) {
                guarded[name] = function (value) {
                    try { callbacks[name].call(this, value); }
                    catch (error) {
                        if (!readErrorReported) {
                            readErrorReported = true;
                            console.error('Subarashiki Hibi text read failed: ' + error);
                        }
                    }
                };
            }
            listeners.push(Interceptor.attach(game.base.add(rva), guarded));
        }
    } catch (error) {
        for (const listener of listeners) listener.detach();
        throw error;
    }
    console.log('Subarashiki Hibi: attached 15th Anniversary Edition BGI text hooks.');
})();

function cleanPlain(text) {
    return (text || '').split('\0')[0].replace(/[\x01-\x09\x0b-\x1f]/g, '').trim();
}

// BGI's extended renderer consumes angle-bracket tags, including <ruby base,reading>
// registration and <r reading>base</r>. Base text follows the tag and stays intact.
// </> escapes the next opening '<'; it does not mean an HTML closing tag.
function cleanExtended(text) {
    if (!text) return '';
    let output = '';
    let escaped = false;
    for (let i = 0; i < text.length;) {
        const character = text[i];
        if (character === '\0') break;
        if (character === '<') {
            if (!escaped) {
                const end = text.indexOf('>', i + 1);
                if (end !== -1) {
                    if (text.slice(i + 1, end) === '/') escaped = true;
                    i = end + 1;
                    continue;
                }
            }
            escaped = false;
        }
        output += character;
        i++;
    }
    return cleanPlain(output);
}

function queue(text, ui) {
    if (!text) return;
    // Names and choice labels can be painted repeatedly with different colors.
    // Deduplicate only UI copies in this burst; keep repeated dialogue messages.
    if (ui && uiSeen.has(text)) return;
    if (ui) uiSeen.add(text);
    pending.push(text);
    clearTimeout(timer);
    // A sustained skip run may have no idle interval; bound its pending batch.
    if (pending.length >= 64) flush();
    else timer = setTimeout(flush, JOIN_DELAY);
}

function flush() {
    clearTimeout(timer);
    const output = pending.join('\n');
    pending = [];
    uiSeen = new Set();
    timer = null;
    if (output) sendText(output);
}
