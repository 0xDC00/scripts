// ==UserScript==
// @name         DRAGON QUEST XI S: Echoes of an Elusive Age
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// * Square Enix
// * Unreal Engine 4
//
// https://store.steampowered.com/app/1295510/DRAGON_QUEST_XI_S_Echoes_of_an_Elusive_Age__Definitive_Edition/
// ==/UserScript==
const __e = Process.enumerateModules()[0];
const handlerLine = trans.send((s) => s, '250+ +'); // join space

(function () {
    const dialogSig1 = 'C??? ?? 01 C??? ?? 01 C??? ?? 08000000 48';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '55 56 57 4?');
    if (beginSubs.length === 0) {
        console.error('[DialoguesPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address;
    console.log('[DialoguesPattern] ' + hookAddress);

    trans.replace(s => {
        //console.warn(JSON.stringify(s));
        return s
            //.replace(/\n+/g, ' ') // single line (already space)
            .replace(/<emoji=([^>]+)./g, '$1') // keep button ID
            .replace(/<br>\s*/g, '\r\n') // keep br
            .replace(/<[^>]*./g, '')
            .trim()
            ;
    });

    Breakpoint.add(hookAddress, function () {
        console.warn('onEnter: ' + this.context.sp.readPointer());
        const address = this.context.rdx;
        const s = address.readPointer().readUtf16String();
        handlerLine(s);
    });
})();