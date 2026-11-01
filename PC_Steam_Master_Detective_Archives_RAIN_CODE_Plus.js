// ==UserScript==
// @name         Master Detective Archives: RAIN CODE Plus
// @version      0.1
// @author       [Carl-Lw]
// @description  Steam
// *Spike Chunsoft Co., Ltd.
//
// https://store.steampowered.com/app/2903950/Master-Detective-Archives-RAIN_CODE_Plus/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

console.warn(`
Known issues:
- Script can be verbose (menu components, button promps etc).
- Character names in a scene prints at scene start.
- During npc conversations the speaking character name might print after text
`);

(function () {
    const pending = new Set();
    let timer = null;
    let lastOutput = "";

    const BUFFER_DELAY = 500;

    attach("OutputHook", "E8 BE 0F BE 02", "rdx");

    function enqueue(text) {
        if (!text) return;

        // Ignore duplicates already in the current batch.
        if (pending.has(text)) return;

        pending.add(text);

        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(flush, BUFFER_DELAY);
    }

    function flush() {
        timer = null;
        if (pending.size === 0) return;

        const output = Array.from(pending).join("\n");
        pending.clear();

        // Suppress identical consecutive batches.
        if (output === lastOutput) return;

        lastOutput = output;

        try {
            handler(output);
        } catch (e) {
            console.error(`[Handler] ${e}`);
        }
    }

    function attach(name, pattern, register) {
        const results = Memory.scanSync(__e.base, __e.size, pattern);

        if (results.length === 0) {
            console.error(`[${name}] Hook not found!`);
            return;
        }
		
		const address = results[0].address;
        console.log(`[${name}] Found hook ${address}`);

        Interceptor.attach(address, function () {
            try {
                const ptr = this.context[register];
                if (ptr.isNull()) return;

                let text = ptr.readUtf16String();
                if (!text) return;

                text = text.replace(/<[^>]+>/g, "");
                enqueue(text);

            } catch (e) {
                console.error(`[${name}] ${e}`);
            }
        });
    }
})();
