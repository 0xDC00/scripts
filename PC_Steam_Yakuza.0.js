// ==UserScript==
// @name         Yakuza 0
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const AND_MARK = ptr('0xFFFFFFFFFFFFFFF0');
const handlerLine = trans.send((s) => s, '250+');

// dialogue box
(function () {
    const dialogSig1 = '75?? ??????03 3C01';
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

    let hookAddress = beginSubs[beginSubs.length - 1].address.add(1); // 0x1406FF210
    let ins = Instruction.parse(hookAddress);
    while (ins.mnemonic !== 'call') {
        ins = Instruction.parse(ins.next);
    }
    hookAddress = ptr(ins.opStr);
    console.log('[DialoguesPattern] ' + hookAddress);

    Interceptor.attach(hookAddress, {
        onEnter(args) {
            this.thiz = args[0];
        },
        onLeave(retVal) {
            const thiz = this.thiz;
            const s = thiz.add(0x68).readCString();
            if (s === '') return;

            console.log('onEnter: dialogueBox');
            const name = thiz.add(0x4a8).readPointer().readCString();
            handlerLine(name + '\r\n' + s.replace(/(\r\n|\n)+/g, ' ').replace(/<.*?>/g, ''));
        }
    });
})();

// subtitle
(function () {
    const dialogSig1 = 'C7???? 14 0000A046 E8';
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
    const hookAddress = beginSubs[beginSubs.length - 1].address.and(AND_MARK); // 0x140397b40
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
    const dialogSig1 = '83?? 03 ???? 83?? 05 ???? 83?? 08';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[ChoicePattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '41?? 48??EC');
    if (beginSubs.length === 0) {
        console.error('[ChoicePattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address; // 0x140864840
    console.log('[ChoicePattern] ' + hookAddress);

    let previous = NULL;
    Breakpoint.add(hookAddress, {
        onEnter(args) {
            const address = this.context.rcx;
            if (address.equals(previous) === true) {
                return;
            }
            previous = address;
            console.log('onEnter: choice');

            const N = address.add(0x24).readU32();
            for (let i = 0; i < N; i++) {
                const s = address.add(0x40 + i * 0x20).readPointer().readCString();
                handlerLine(s);
            }
        }
    });
})();

// subtitle box
(function () {
    const dialogSig1 = '38010000 ???? ????????  ?????? 58010000';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[BoxPattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '5? 48??EC');
    if (beginSubs.length === 0) {
        console.error('[BoxPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address.sub(5).and(AND_MARK); // 0x1401F7160
    console.log('[BoxPattern] ' + hookAddress);

    // 0x1401F7160 & 0x1401F74B0 from 0x1401D6D20
    let preAddress1 = 0, preAddress2 = 0, i = 0;
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            const address = args[0].add(0x158).readPointer();
            //console.log(hexdump(address, {length: 0x190}))

            const index = i++ % 2;
            if (index === 0) {
                if (address.equals(preAddress1) === true) {
                    return;
                }
                preAddress1 = address; // name
            }
            else {
                if (address.equals(preAddress2) === true) {
                    return;
                }
                preAddress2 = address; // str
            }

            const N = args[0].add(0x138).readU32(); // numLine

            const arr = [];
            for (let i = 0; i < N; i++) {
                const s = address.add(0x10 + i * 0x90).readCString();
                arr.push(s)
            }
            const s = arr.join(''); // single line
            handlerLine(s);
        }
    });
})();

// item list
(function () {
    const handlerLine = trans.send((s) => s, 250); // only last

    const dialogSig1 = 'EC000000 FF ???? ???????? ?????? 08010000 00'; // found2 => use last
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[ShopItemPattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '5? 48??EC');
    if (beginSubs.length === 0) {
        console.error('[ShopItemPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address.and(AND_MARK); // 0x14070D5F0
    console.log('[ShopItemPattern] ' + hookAddress);

    // 0x14070D5F0 & 0x14070D0B0 (name)
    let previous = NULL;
    Breakpoint.add(hookAddress, {
        onEnter(args) {
            const addressObject = this.context.rcx;
            const address = addressObject.add(0x108).readPointer();
            if (address.equals(previous) === true || address.isNull() === true) {
                return;
            }
            previous = address;
            console.log('onEnter: itemDescription');

            const addressName = addressObject.add(0x340).readPointer();
            const offsetName = addressObject.add(0xEC).readU32() * 0x60;
            const name = addressName.add(offsetName + 0x30).readPointer().readCString();

            const s = address.readCString().replace(/(\r\n|\n)+/g, ' ');
            handlerLine(name + '\r\n' + s);
        }
    });
})();

// skill list
(function () {
    const handlerLine = trans.send((s) => s, 250); // only last

    const dialogSig1 = '08 4D??40 38';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[SkillPattern] no result!');
        return;
    }
    const beginSubs = Memory.scanSync(results[results.length - 1].address.sub(0x200), 0x200, '5? 48??EC');
    if (beginSubs.length === 0) {
        console.error('[SkillPattern] no result! (2)');
        return;
    }
    const hookAddress = beginSubs[beginSubs.length - 1].address.and(AND_MARK); // 0x1409FEC80
    console.log('[SkillPattern] ' + hookAddress);

    let previous = NULL;
    Breakpoint.add(hookAddress, {
        onEnter(args) {
            const address = this.context.rcx.readPointer();
            if (address.equals(previous) === true || address.isNull() === true) {
                return;
            }
            previous = address;
            console.log('onEnter: skillDescription');

            const name = address.add(0x28).readPointer().readCString();

            const s = address.add(0x38).readPointer().readCString().replace(/(\r\n|\n)+/g, ' ');
            const step = address.add(0x58).readPointer().readCString();
            handlerLine(name + '\r\n' + s + '\r\n\r\n' + step);
        }
    });
})();

// completion list
(function () {
    const handlerLine = trans.send((s) => s, 250); // only last

    const dialogSig1 = '98000000 ?? ???????? BA 00700000 E8 ???????? 4?';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[CompletionPattern] no result!');
        return;
    }
    const hookAddress = results[results.length - 1].address.add(4 + 5 + 5); // 14074DF01
    console.log('[CompletionPattern] ' + hookAddress);

    let previous = '';
    Breakpoint.add(hookAddress, {
        onEnter(args) {
            const s = this.context.r8.readCString();
            if (s === previous) {
                return;
            }
            previous = s;
            console.log('onEnter: completionList');

            handlerLine(s.replace(/(\r\n|\n)+/g, ' '));
        }
    });
})();

// tutorial
(function () {
    const handlerLine = trans.send((s) => s, 250); // only last

    const dialogSig1 = '4????? E8 ???????? 85C0 ???? ???????? ???? 78010000 ?????? 70010000';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig1);
    if (results.length === 0) {
        console.error('[TutorialPattern] no result!');
        return;
    }
    const result = results[results.length - 1];
    const hookAddress = result.address.add(result.size + 8 + 5); // 0x14014DCC3
    console.log('[TutorialPattern] ' + hookAddress);

    let previous = NULL;
    Breakpoint.add(hookAddress, {
        onEnter(args) {
            const address = this.context.rax;
            if (address.equals(previous) === true) {
                return;
            }
            previous = address;
            console.log('onEnter: tutorial');

            const name = address.readPointer().readCString();
            const desc = address.add(0x20).readPointer().readCString().replace(/(\r\n|\n)+/g, ' ');
            const step = address.add(0x28).readPointer().readCString().replace(/(\r\n|\n)+/g, ' ');

            handlerLine(name + '\r\n' + desc + '\r\n\r\n' + step);
        }
    });
})();
