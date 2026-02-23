// ==UserScript==
// @name         YS X Proud Nordics
// @version      v1.0.3 r10	
// @author       meylink
// @description  Steam
// * Nihon Falcom
//
// https://store.steampowered.com/app/3949290/Ys_X_Proud_Nordics/
// ==/UserScript==
const game = Process.getModuleByName("ysx_pn.exe");
const handler = trans.send(s => s, -100);

const hook = game.base.add(0x492CB0);

let last = "";

Interceptor.attach(hook, {
    onLeave() {
        try {
            const p = this.context.rdi;
            if (!p || p.isNull()) return;

            let text = p.readUtf8String();
            if (!text) return;

            text = text.replace(/<[^>]+>/g, "").replace(/\\[A-Z]+\[?\d*\]?/gi, "").trim();
            if (!text || text === last) return;

            last = text;
            handler(text);

        } catch (_) {}
    }
});