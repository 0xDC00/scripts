// ==UserScript==
// @name         Like a Dragon: Pirate Yakuza in Hawaii
// @version      
// @author       Koukdw
// @description  Steam (maybe untested) + Gamepass
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const handlerLine = trans.send((s) => s, '250+');

// Dialogue Message
// 0x1424A356E (Gamepass)
(function () {
    const subtitleSig = 'E8 ???????? 41 B8 06000000 48 8D 55 17';
    const results = Memory.scanSync(__e.base, __e.size, subtitleSig);
    if (results.length === 0) {
        console.error('[DialoguePattern] no result!');
        return;
    }

    const hookAddress = results[0].address;
    console.log('[DialoguePattern] @ ' + hookAddress);
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            const ptr = this.context.rdx;
            const name = ptr.add(0x10).readPointer().readCString()
            const msg = ptr.add(0x8).readPointer().readCString()
            if (name.length === 0 || msg.length === 0) {
                return;
            }
            console.log('onEnter: Dialogue');
            handlerLine(name + "\n" + msg);
        }
    });
})();



// Subtitle Message
// 0x14d63c4d9 (Gamepass) might not work on steam need test
(function () {
    const subtitleSig = '40 38 39 0F 84 3? 01 00 00';
    const results = Memory.scanSync(__e.base, __e.size, subtitleSig);
    if (results.length === 0) {
        console.error('[SubtitlePattern] no result!');
        return;
    }
    for (let i = 0; i < results.length; i++) {
        const hookAddress = results[i].address;
        console.log(`[SubtitlePattern ${i}] @ ` + hookAddress);
        Interceptor.attach(hookAddress, {
            onEnter(args) {
                const address = this.context.rcx;
                const sub = address.readCString();
                console.log('onEnter: Subtitle');
                handlerLine(sub);
            }
        });
    }
})();

// help message
// same pattern as Infinite Wealth
(function () {
    const helpSig = 'E8 ???????? 44 8B C0 4C 8D 0D';
    const results = Memory.scanSync(__e.base, __e.size, helpSig);
    if (results.length === 0) {
        console.error('[HelpPattern] no result!');
        return;
    }
    const beginHelp = Memory.scanSync(results[0].address, 0x100, '4? 85 ?? 74 0? 4? 8B');
    if (beginHelp.length === 0) {
        console.error('[HelpPattern] no result! (2)');
        return;
    }
    const helpAddress = beginHelp[0].address.add(3);
    const ins = Instruction.parse(helpAddress.add(2)); // mov rax, [??+30]
    console.log('[HelpPattern] @ ' + helpAddress);
    Interceptor.attach(helpAddress, {
        onEnter(args) {
            const address = this.context[ins.operands[1].value.base];   // <= register depending on what we get after parsing instruction
            const title = address.add(0x30).readPointer().readCString()
            const content = address.readPointer().readCString()
            console.log('onEnter: Help');
            handlerLine(title);
            handlerLine(content);
        }
    });
})();

