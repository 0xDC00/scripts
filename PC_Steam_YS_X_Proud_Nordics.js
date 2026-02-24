// ==UserScript==
// @name         YS X Proud Nordics
// @version      v1.0.3 r10	
// @author       meylink
// @description  Steam
// * Nihon Falcom
//
// https://store.steampowered.com/app/3949290/Ys_X_Proud_Nordics/
// ==/UserScript==

const moduleName = "ysx_pn.exe";
const game = Process.getModuleByName(moduleName);
const handler = trans.send((s) => s, -100);

const pattern = "4C 8B DC 55 56 41 54 41 55 41 56 41 57 49 8D AB D8 FE FF FF 48 81 EC F8 01 00 00 48 8B 05 ?? ?? ?? ?? 48 33 C4 48 89 85 C0 00 00 00";

const matches = Memory.scanSync(game.base, game.size, pattern);

const hookAddress = matches[0].address;

let last = "";

Interceptor.attach(hookAddress, {
  onLeave() {
    try {
      const p = this.context.rdi;
      if (!p || p.isNull()) return;

      let text = p.readUtf8String();
      if (!text) return;

      text = text
        .replace(/<[^>]+>/g, "")
        .replace(/\\[A-Z]+\[?\d*\]?/gi, "")
        .trim();
      if (!text || text === last) return;

      last = text;
      handler(text);
    } catch (_) {}
  },
});
