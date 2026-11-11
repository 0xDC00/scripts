// ==UserScript==
// @name         Hatsuyuki Sakura / はつゆきさくら
// @version      0.1.0
// @author       Jiro3000
// @description  NekoNyan PC release, Artemis Rev.3179 (x64)
//
// Tested release: https://vndb.org/r125882
// ==/UserScript==

// Confirmed working with Agent's remote Frida connection in CrossOver.
// Supported hatsuyuki.exe SHA-256:
// 8953562b80608046662bd8c89015d04236b0ba3afee10c36469c11403de3ebaf
// Relative addresses support ASLR; header and instruction checks reject other builds.

// Includes text-based choices and menus. Set false for the main message windows only.
const CAPTURE_UI = true;
const UI_DELAY = 250;
const sendText = trans.send(s => s);
const states = new Map();
let readErrorReported = false;

(function () {
    if (Process.platform !== 'windows' || Process.arch !== 'x64') {
        throw new Error('Hatsuyuki Sakura requires the Windows x64 process.');
    }
    const game = Process.findModuleByName('hatsuyuki.exe');
    if (game === null) throw new Error('Attach to hatsuyuki.exe.');
    const pe = game.base.add(game.base.add(0x3c).readU32());
    if (game.base.readU16() !== 0x5a4d || pe.readU32() !== 0x4550 ||
        pe.add(4).readU16() !== 0x8664 || pe.add(8).readU32() !== 0x65834031 ||
        pe.add(0x50).readU32() !== 0x518000) {
        throw new Error('Unsupported hatsuyuki.exe build (expected Artemis Rev.3179).');
    }

    const hooks = [
        // print, after CLinkableTextLayer::insert returns: RSI=input, EAX=result,
        // [RSP+0x30]=first unconsumed byte. Only capture the consumed prefix.
        [0xcc835, '83 f8 ff 75 25 48 8b 44 24 30 48 89 44 24 20', function () {
            const c = this.context;
            if ((c.r14.toInt32() & 0xff) !== 0 || c.rdi.add(0x3520).readS32() !== 0) return;
            const result = c.rax.toInt32();
            if (result === -1) return;
            let text;
            if (result === -2) {
                const count = c.rsp.add(0x30).readPointer().sub(c.rsi).toInt32();
                if (count <= 0 || count > 0x100000) return;
                text = c.rsi.readUtf8String(count);
            } else {
                text = c.rsi.readUtf8String();
            }
            append(c.rdi, text);
        }],
        // print inside ruby: RDX is the base text, before std::string::append.
        // The annotation is supplied by the separate ruby command, so is excluded.
        [0xcc75f, 'e8 9c f1 f3 ff 90 48 8d 4c 24 48 e8 e1 ed f3 ff', function () {
            const c = this.context;
            if ((c.r14.toInt32() & 0xff) === 0 && c.rdi.add(0x3520).readS32() === 0) {
                append(c.rdi, c.rdx.readUtf8String());
            }
        }],
        [0xcccb0, '40 55 56 57 41 56 41 57 48 81 ec 80 00 00 00', function () {
            if ((this.context.r8.toInt32() & 0xff) === 0) append(this.context.rcx, '\n');
        }],
        [0xcce40, '40 55 56 57 41 56 41 57 48 81 ec e0 00 00 00', function () {
            if ((this.context.r8.toInt32() & 0xff) !== 0) return;
            const script = this.context.rcx;
            const state = stateFor(script);
            const id = readString(script.add(0x35e0));
            const layer = state.layers.get(id);
            if (layer === undefined) return;
            // rp clears only the selected layer. A cleared name means narration.
            if (isName(id)) layer.text = '';
            else flush(state, id);
        }],
        // @ starts a click/auto/skip wait after the whole message has been inserted.
        [0xcbf20, '40 57 48 83 ec 60 48 c7 44 24 30 fe ff ff ff', function () {
            flush(stateFor(this.context.rcx));
        }],
        // stop also publishes text-only choice windows without an @ command.
        [0xc7bb0, '40 57 48 83 ec 50 48 c7 44 24 20 fe ff ff ff', function () {
            flush(stateFor(this.context.rcx));
        }],
        [0xcaad0, '40 53 48 83 ec 40 48 8b d9 48 c7 44 24 30 00 00 00 00', function () {
            for (const state of states.values()) clearTimeout(state.timer);
            states.clear();
        }],
    ];

    // Validate every location before attaching anything. Never guess on a mismatch.
    for (const [rva, signature] of hooks) {
        const expected = signature.split(' ').map(s => parseInt(s, 16));
        const actual = new Uint8Array(game.base.add(rva).readByteArray(expected.length));
        if (expected.some((b, i) => actual[i] !== b)) {
            throw new Error('Unsupported hook bytes at RVA 0x' + rva.toString(16));
        }
    }
    const listeners = [];
    try {
        for (const [rva, , callback] of hooks) {
            listeners.push(Interceptor.attach(game.base.add(rva), function () {
                try { callback.call(this); }
                catch (error) {
                    if (!readErrorReported) {
                        readErrorReported = true;
                        console.error('Hatsuyuki Sakura text read failed: ' + error);
                    }
                }
            }));
        }
    } catch (error) {
        for (const listener of listeners) listener.detach();
        throw error;
    }
    console.log('Hatsuyuki Sakura: attached Artemis Rev.3179 text hooks.');
})();

// MSVC x64 std::string: inline storage up to 15 bytes, size+0x10, capacity+0x18.
function readString(address) {
    const size = address.add(0x10).readU64().toNumber();
    if (size > 0x100000) throw new Error('Invalid native string length');
    if (size === 0) return '';
    const data = address.add(0x18).readU64().compare(15) > 0 ? address.readPointer() : address;
    return data.readUtf8String(size).split('\0')[0];
}

function stateFor(script) {
    const key = script.toString();
    if (!states.has(key)) states.set(key, { layers: new Map(), timer: null });
    return states.get(key);
}

function isStory(id) { return /\.mw\.adv_(adv|sub|name)$/.test(id); }
function isName(id) { return id.endsWith('.mw.adv_name'); }

function append(script, text) {
    if (!text) return;
    const id = readString(script.add(0x35e0));
    if (!isStory(id) && !CAPTURE_UI) return;
    const state = stateFor(script);
    if (!state.layers.has(id)) state.layers.set(id, { text: '' });
    const layer = state.layers.get(id);
    layer.text += text;
    if (layer.text.length > 0x100000) {
        layer.text = '';
        throw new Error('Text buffer exceeded limit');
    }
    // UI text has no consistent @ boundary. Dialogue stays buffered across timed
    // waits, font changes and ruby fragments until @, rp or stop.
    if (!isStory(id)) {
        clearTimeout(state.timer);
        state.timer = setTimeout(() => flush(state, undefined, true), UI_DELAY);
    }
}

function flush(state, selected, uiOnly = false) {
    const output = [];
    for (const [id, layer] of state.layers) {
        if (isName(id) || (selected !== undefined && selected !== id) || (uiOnly && isStory(id))) continue;
        const text = layer.text.trim();
        if (text) {
            const nameId = id.replace(/\.mw\.adv_(adv|sub)$/, '.mw.adv_name');
            const name = isStory(id) ? state.layers.get(nameId)?.text.trim() : '';
            output.push(name ? name + '\n' + text : text);
        }
        state.layers.delete(id);
    }
    if (output.length !== 0) sendText(output.join('\n'));
}
