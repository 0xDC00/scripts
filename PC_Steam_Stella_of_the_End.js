// ==UserScript==
// @name         Stella of the End (終のステラ)
// @version      1.0.0
// @author       Musi
// @description  Steam
// * KEY
// * VisualArts
//
// https://store.steampowered.com/app/2510770/Stella_of_The_End/
// ==/UserScript==

const __e = Process.enumerateModules()[0];
const handler = trans.send(s => s, -100);

// print's opcode handler
const printHook = {
    name: 'print',
    pattern: '40 55 56 57 41 54 41 55 41 56 41 57 48 8d 6c 24 80 48 81 ec 80 01 00 00 48 c7 44 24 40', // function prologue
    address: null,
};

// shared per-opcode argument table lookup. called by every opcode so its return value is only trusted while execution is inside printHook
const argLookupHook = {
    name: 'argLookup',
    pattern: '48 89 5c 24 10 48 89 74 24 18 48 89 7c 24 20 41 56 48 83 ec ?? 48 8b 19 48 8b f2 4c 8b f1 48 8b 7b 08 80 7f 19 00 75 ?? 0f 1f 84 00 00 00 00 00 48 8d 4f 20 48 8b d6 e8 24',
    address: null,
};

function getPatternAddress(name, pattern) {
    const results = Memory.scanSync(__e.base, __e.size, pattern);
    if (results.length === 0) {
        throw new Error(`[${name}] Hook not found!`);
    }
    if (results.length > 1) {
        console.warn(`${name} has ${results.length} results`);
    }
    const address = results[0].address;
    console.log(`[${name}] Found hook ${address}`);
    return address;
}

(function attach() {
    printHook.address = getPatternAddress(printHook.name, printHook.pattern);
    argLookupHook.address = getPatternAddress(argLookupHook.name, argLookupHook.pattern);

    let inPrint = false;
    let printCtx = null;

    Interceptor.attach(printHook.address, {
        onEnter: function (args) {
            inPrint = true;
            printCtx = this.context.rcx; // interpreter context, holds active layer id
        },
        onLeave: function (retval) {
            inPrint = false;
        }
    });

    Interceptor.attach(argLookupHook.address, {
        onLeave: function (retval) {
            if (!inPrint || !retval || retval.isNull()) return;

            let text = null;
            try {
                const len = retval.add(0x18).readU64().toNumber();
                const dataPtr = len > 0xf ? retval.readPointer() : retval;
                text = dataPtr.readUtf8String();
            } catch (e) { return; }
            if (!text || text === '「」（）『』') return; // fontinit char-class setup, not dialogue

            // gate on the active message-layer id (set by chgmsg) so menus, prompts, and backlog re-renders that also route through print get rejected
            let layerId = null;
            try {
                const fieldPtr = printCtx.add(0x35e0);
                const flen = fieldPtr.add(0x18).readU64().toNumber();
                const fdata = flen > 0xf ? fieldPtr.readPointer() : fieldPtr;
                layerId = fdata.readUtf8String();
            } catch (e) {}
            if (layerId !== '1.80.mw.adv_adv') return;

            handler(text);
        }
    });
})();
