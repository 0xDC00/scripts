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

const handler = (msg) => {
    try {
        if (typeof trans !== 'undefined' && trans && typeof trans.send === 'function') {
            trans.send(msg, -100);
        } else if (typeof send === 'function') {
            send(msg);
        } else {
            console.log(msg);
        }
    } catch (e) {
        console.log(msg);
    }
};

(function () {
    let lastText = "";
    let cachedOffset = -1;

    const hookStates = {
        dialogue: true,      // Always ON
        extra: false
    };

    const hooks = [
        { name: 'dialogue', offset: 0xFBEB5D, register: 'r9', category: 'dialogue' },
        { name: 'extra', offset: 0xFBE27D, register: 'r8', category: 'extra' },
    ];

    console.log("=== TEXT HOOK CONTROLS ===");
    console.log("F1 - Toggle Extra text - Used for menus, tutorials, etc. Activate it only when necessary because it produce a lot of text");

    let GetAsyncKeyState;
    const user32Ptr = Module.findExportByName('user32.dll', 'GetAsyncKeyState');

    if (user32Ptr) {
        try {
            GetAsyncKeyState = new NativeFunction(user32Ptr, 'int', ['int']);
        } catch (e) {
            console.error('Failed to create GetAsyncKeyState:', e);
            GetAsyncKeyState = () => 0;
        }
    } else {
        console.warn('GetAsyncKeyState not found — keyboard toggles disabled.');
        GetAsyncKeyState = () => 0;
    }

    let keysPressed = {};

    setInterval(() => {
        if (GetAsyncKeyState(0x70) & 0x8000) {
            if (!keysPressed.F1) {
                keysPressed.F1 = true;
                hookStates.extra = !hookStates.extra;
                console.log(`[F1] extra: ${hookStates.extra ? 'ON' : 'OFF'}`);
            }
        } else keysPressed.F1 = false;
    }, 100);


    hooks.forEach(hook => {
        const addr = __e.base.add(hook.offset);
        console.log(`[${hook.name}] Hook ready @ 0x${hook.offset.toString(16).toUpperCase()}`);

        Interceptor.attach(addr, function () {
            if (!hookStates[hook.category]) return;

            const reg = this.context[hook.register];
            if (!reg || reg.isNull()) return;

            const text = extractText(reg);
            if (text && text !== lastText) {
                lastText = text;

                const cleaned = text
                    .replace(/\[([^\]\/]+)\/[^\]]+\]/g, '$1')
                    .replace(/\\n/g, '\n')
                    .replace(/\[(CG|CY|CR|CB|C)\]/g, '')
                    .replace(/\$gaiji_keyword\d+/g, '');

                handler(cleaned);
            }
        });
    });


    function extractText(ptr) {
        if (cachedOffset >= 0) {
            try {
                const s = ptr.add(cachedOffset).readUtf8String();
                if (s && s.length > 2 && /[ぁ-んァ-ン一-龯]/.test(s)) return s;
            } catch {}
        }

        const offsets = [0, 0x10, 0x20, 0x40, 0x100, 0x200, 0x240, 0x250];
        for (const off of offsets) {
            try {
                const s = ptr.add(off).readUtf8String();
                if (s && s.length > 2 && /[ぁ-んァ-ン一-龯]/.test(s)) {
                    cachedOffset = off;
                    return s;
                }
            } catch {}
        }

        try {
            const ptr2 = ptr.readPointer();
            for (const off of [0, 0x10, 0x20]) {
                try {
                    const s = ptr2.add(off).readUtf8String();
                    if (s && s.length > 2 && /[ぁ-んァ-ン一-龯]/.test(s)) return s;
                } catch {}
            }
        } catch {}

        return null;
    }

    console.log("Dialogue text ALWAYS ON");
    console.log("F1 toggle other text types");
})();
