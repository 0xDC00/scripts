// ==UserScript==
// @name         Like a Dragon : Infinite Wealth
// @version      
// @author       Koukdw
// @description  Steam + Gamepass
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const handlerLine = trans.send((s) => s, '250+');

(function () {
    const dialogSig = '4? ?? ?? 0C010000 4? ?? ?? D0010000 0000803f';
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[DialoguesPattern] no result!');
        return;
    }
    console.log('[DialoguePattern] @ ' + results[results.length -1].address);


    const beginName = Memory.scanSync(results[results.length - 1].address.sub(0x315), 0x100, '49 8D 57 10 48 8B C8 E8');
    if (beginName.length === 0) {
        console.error('[DialogueNamePattern] no result!');
        return;
    }
    const nameAddress = beginName[beginName.length - 1].address.add(4);
    console.log('[DialogueNamePattern] @ ' + nameAddress);


    const beginMessage = Memory.scanSync(results[results.length - 1].address.sub(0x100), 0x100, '08 E8');
    if (beginMessage.length === 0) {
        console.error('[DialogueMessagePattern] no result!');
        return;
    }
    const messageAddress = beginMessage[beginMessage.length - 1].address.add(1);
    console.log('[DialogueMessagePattern] @ ' + messageAddress);

    // Breakpoint.add(nameAddress, {
    //     onEnter(args) {
    //         console.log('onEnter: Dialogue Name');
    //         const address = this.context.rdx;
    //         const name = address.readPointer().readCString();
    //         handlerLine(name);
    //     }
    // });
    Interceptor.attach(nameAddress, {
        onEnter(args) {
            console.log('onEnter: Dialogue Name');
            const address = this.context.rdx;
            const name = address.readPointer().readCString();
            handlerLine(name);
        }
    });

    // Breakpoint.add(messageAddress, {
    //     onEnter(args) {
    //         console.log('onEnter: Dialogue Message');
    //         const address = this.context.rcx;
    //         const msg = address.readCString();
    //         handlerLine(msg);
    //     }
    // });
    Interceptor.attach(messageAddress, {
        onEnter(args) {
            console.log('onEnter: Dialogue Message');
            const address = this.context.rcx;
            const msg = address.readCString();
            handlerLine(msg);
        }
    });
})();


(function () {
    const subtitleSig = '0F83 ??000000 B9 01000000';
    const results = Memory.scanSync(__e.base, __e.size, subtitleSig);
    if (results.length === 0) {
        console.error('[SubtitlePattern] no result!');
        return;
    }

    const hookAddress = results[results.length - 1].address.sub(2+6+4+4+4);
    console.log('[SubtitlePattern] @ ' + hookAddress);
    // Breakpoint.add(hookAddress, {
    //     onEnter(args) {
    //         console.log('onEnter: Subtitle @ ' + hookAddress);
    //         const address = this.context.rdx;
    //         const sub = address.readCString();
    //         handlerLine(sub);
    //     }
    // });
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            console.log('onEnter: Subtitle @ ' + hookAddress);
            const address = this.context.rdx;
            const sub = address.readCString();
            handlerLine(sub);
        }
    });
})();


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
    //console.log(JSON.stringify(ins, null, 2))
    console.log('[HelpPattern] @ ' + helpAddress);
    // Breakpoint.add(helpAddress, {
    //     onEnter(args) {
    //         console.log('onEnter: Help');
    //         const address = this.context[ins.operands[1].value.base];   // <= register depending on what we get after parsing instruction
    //         //console.log("Title 0x30");
    //         //console.log(address.add(0x30).readPointer().readCString());
    //         const title = address.add(0x30).readPointer().readCString()
    //         //console.log("Content 0x0");
    //         //console.log(address.readPointer().readCString());
    //         const content = address.readPointer().readCString()
    //         // console.log("0x10");
    //         // console.log(address.add(0x10).readPointer().readCString());
    //         // console.log("0x20");
    //         // console.log(address.add(0x20).readPointer().readCString());
    //         handlerLine(title);
    //         handlerLine(content);
    //     }
    // });
    Interceptor.attach(helpAddress, {
        onEnter(args) {
            console.log('onEnter: Help');
            const address = this.context[ins.operands[1].value.base];   // <= register depending on what we get after parsing instruction
            //console.log("Title 0x30");
            //console.log(address.add(0x30).readPointer().readCString());
            const title = address.add(0x30).readPointer().readCString()
            //console.log("Content 0x0");
            //console.log(address.readPointer().readCString());
            const content = address.readPointer().readCString()
            // console.log("0x10");
            // console.log(address.add(0x10).readPointer().readCString());
            // console.log("0x20");
            // console.log(address.add(0x20).readPointer().readCString());
            handlerLine(title);
            handlerLine(content);
        }
    });
})();