// ==UserScript==
// @name         Wo Long: Fallen Dynasty
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// * Team Ninja
// * Katana Engine
//
// https://store.steampowered.com/app/1448440/Wo_Long_Fallen_Dynasty/
// ==/UserScript==
const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 500);
const __e = Process.enumerateModules()[0];
// SubtitleName
(function () {
    let timer;
    function singleLine(s) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            console.warn('onEnter: SubtitleName');
            handlerLine(s);
        }, 50);
    }

    const dialogSig1 = '8??? 08 E8 ???????? 48894424 60';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[SubtitleNamePattern] no result!');
        return;
    }

    const found = results[results.length - 1];
    const hookAddress = found.address.add(found.size - 5);
    console.log('[SubtitleNamePattern] ' + hookAddress);

    Breakpoint.add(hookAddress, function () {
        const retVal = this.context.rax;
        const s = retVal.readUtf16String();
        //console.log(s);
        singleLine(s);
    });
})();
// Subtitle
(function () {
    let timer;
    function singleLine(s) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            console.warn('onEnter: Subtitle');
            handlerLine(s);
        }, 100);
    }
    {
        const dialogSig1 = '8B?? 40040000 48???? ???????? E8 ???????? 48';
        const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
        if (results.length === 0) {
            console.error('[SubtitlePattern] no result!');
            return;
        }

        const found = results[results.length - 1];
        const hookAddress = found.address.add(found.size - 1);
        console.log('[SubtitlePattern] ' + hookAddress);

        Breakpoint.add(hookAddress, function () {
            const retVal = this.context.rax;
            const s = retVal.readUtf16String();
            //console.log(s);
            singleLine(s);
        });
    }
    {
        const dialogSig1 = '488B0D ???????? E8 ???????? 4C8B?? 4????? ???????? B?';
        const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
        if (results.length === 0) {
            console.error('[SubtitleIngamePattern] no result!');
            return;
        }

        const found = results[0];
        const hookAddress = found.address.add(found.size - (3 + 7 + 1));
        console.log('[SubtitleIngamePattern] ' + hookAddress);

        Breakpoint.add(hookAddress, function () {
            const retVal = this.context.rax;
            const s = retVal.readUtf16String().replace(/\#/g, '\r\n');
            //console.log(s);
            singleLine(s);
        });
    }
})();
// ItemDesc
(function () {
    let timer;
    function singleLine(s) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            console.warn('onEnter: ItemDesc');
            handlerLine(s);
        }, 50);
    }
    const dialogSig1 = '7? ?? 4A?????? 48 ?? ?? 74 ?? 48???? ???????? 4????? E8 ???????? 48';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[ItemDescPattern] no result!');
        return;
    }

    const found = results[0];
    const hookAddress = found.address.add(found.size - 1);
    console.log('[ItemDescPattern] ' + hookAddress);

    Breakpoint.add(hookAddress, function () {
        const retVal = this.context.rax;
        const s = retVal.readUtf16String();
        //console.log(s);
        singleLine(s);
    });
})();
// CharsDesc (ItemName)
(function () {
    let timer;
    function singleLine(s) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            console.warn('onEnter: CharsDesc');
            handlerLine(s);
        }, 50);
    }
    const dialogSig1 = '48???? 10 48???? 74 ?? 48?????? 40 E8';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[CharsDescPattern] no result!');
        return;
    }

    const found = results[0];
    let hookAddress = found.address.add(found.size + 4);
    let ins = Instruction.parse(hookAddress);
    while (ins.mnemonic !== 'call') {
        ins = Instruction.parse(ins.next);
    }
    hookAddress = ins.next;
    console.log('[CharsDescPattern] ' + hookAddress);

    Breakpoint.add(hookAddress, function () {
        const retVal = this.context.rax;
        const s = retVal.readUtf16String();
        //console.log(s);
        singleLine(s);
    });
})();
// Tutorial
(function () {
    const dialogSig1 = '4????? 75?? EB ?? 4????? 74?? 41???? 488B0D ???????? E8 ????????  4885C0 74?? 488B?? 45???? 664439';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[TutorialPattern?] no result!');
        return;
    }

    const found = results[1]; // 0=title, 1=desc, ...
    const hookAddress = found.address.add(found.size - (3 + 2 + 3 + 3 + 3));
    console.log('[TutorialPattern] ' + hookAddress);

    Breakpoint.add(hookAddress, function () {
        console.warn('onEnter: Tutorial');
        const retVal = this.context.rax;
        const s = retVal.readUtf16String();
        //console.log(s);
        handlerLine(s);
    });
})();