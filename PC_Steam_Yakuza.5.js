// ==UserScript==
// @name         Yakuza 5
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const AND_MARK = ptr('0xFFFFFFFFFFFFFFF0');
const handlerLine = trans.send((s) => s, '250+');

// dialogue box
(function () {
    const dialogSig1 = '3C02 75?? 0F?????? 3C08 ???? 4?';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }

    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '5? 48??EC');
    if (beginSubs.length === 0) {
        console.error('[DialoguesPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address.and(AND_MARK); // 0x140c17040
    console.log('[DialoguesPattern] ' + hookAddress);

    Interceptor.attach(hookAddress, {
        onEnter(args) {
            this.thiz = args[0];
        },
        onLeave(retVal) {
            const thiz = this.thiz;
            const s = thiz.add(0x80).readCString();
            if (s === '') return;

            console.log('onEnter: dialogueBox');
            const name = thiz.add(0x4b8).readPointer().readCString();
            handlerLine(name + '\r\n' + s.replace(/(\r\n|\n)+/g, ' ').replace(/<.*?>/g, ''));
        }
    });
})();

// subtitle
(function () {
    const dialogSig1 = 'C7?? 14 0000A046 74';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[SubtitlePattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '5? 48??EC');
    if (beginSubs.length === 0) {
        console.error('[SubtitlePattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address.and(AND_MARK); // 0x1410E6880
    console.log('[SubtitlePattern] ' + hookAddress);

    let previous = '';
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            const address = args[1];
            const s = address.readCString();
            if (s === previous) {
                return;
            }
            previous = s;
            console.log('onEnter: subtitle');

            handlerLine(s.replace(/(\r\n|\n)+/g, ' '));
        }
    });
})();

// choice
(function () {
    const dialogSig1 = '83F? 03 ???? 83?? 05 ???? 83?? 08';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[ChoicePattern] no result!');
        return;
    }

    let previous = NULL;
    function onEnter() {
        const address = this.context.rcx;
        if (address.equals(previous) === true) {
            return;
        }
        previous = address;
        console.log('onEnter: choice');

        const N = address.add(0x10).readU32();
        for (let i = 0; i < N; i++) {
            const s = address.add(0x28 + i * 0x20).readPointer().readCString();
            handlerLine(s);
        }
    }

    for (let i = 0; i < results.length; i++) {
        const result = results[i];

        const beginSubs = Memory.scanSync(result.address.sub(0x300), 0x300, '5? 48??EC');
        if (beginSubs.length === 0) {
            console.error('[ChoicePattern] no result! (2)');
            continue;
        }
        const hookAddress = beginSubs[beginSubs.length - 1].address.and(AND_MARK); // 0x1410E2D50
        console.log('[ChoicePattern] ' + hookAddress);

        Breakpoint.add(hookAddress, onEnter);
    }
})();
