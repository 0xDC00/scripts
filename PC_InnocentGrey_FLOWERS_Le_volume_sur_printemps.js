// ==UserScript==
// @name         FLOWERS -Le volume sur printemps-
// @version      
// @author       [DC]
// @description  Spring
// * Innocent Grey
// * 
//
// https://vndb.org/v14267
// ==/UserScript==
const mainHandler = trans.send(handler, '250+');
function handler(regs, index) {
    const address = regs[index];

    console.log('onEnter');

    let s = address.readShiftJisString();
    if (s[0] === '＃') {
        s = s.substring(1);
    }
    else {
        s = s.replace(/＄/g, '\n');

        const rubis = s.matchAll(/\<([^\<]+).([^\>]+)./g);
        for (const rubi of rubis) {
            console.log('rubi', rubi[2]);
            console.log('rube', rubi[1]);
        }
        s = s.replace(/\<([^\<]+).([^\>]+)./g, '$1');
    }
    return s;
}

/* Hooks */
const __e = Process.findModuleByName('script.dll');
const __ranges = __e.enumerateRanges('r-x');

//// Dialogue
{
    const sig1 = '8B?? ????0000 5? 5? 5? E8 ???????? 68 00010000';
    const results = scanSync(__ranges, sig1);
    if (results.length === 0) {
        console.error('[DialoguePattern] no result!');
        return;
    }
    const hookAddress = results[0].address;
    let inst = Instruction.parse(hookAddress); // mov e?x, dword ptr ds:[ebx+0x2004]
    inst = Instruction.parse(inst.next);       // push e?x
    inst = Instruction.parse(inst.next);       // push e?x
    const expr = inst.opStr;

    console.log('Attach Dialog:', hookAddress, expr);
    Breakpoint.add(hookAddress, function () {
        mainHandler.call(this, this.context, expr);
    });
}
//// More
{
    const sig1 = 'E8 ???????? 89?? ????0000 5?';
    const results = scanSync(__ranges, sig1);
    if (results.length === 0) {
        console.error('[MorePattern] no result!');
        return;
    }
    const hookAddress = results[0].address.add(5);

    console.log('Attach More:', hookAddress);
    Breakpoint.add(hookAddress, function () {
        const address = this.context.eax;
         // 0x400=dialogues+name (slow)
         // 0x43f=center
         // 0x81d=choice
        const type = address.readU16();
        if (type === 0x43f) {
            this.context.__address__ = address.add(4);
            mainHandler.call(this, this.context, '__address__');
        }
        else if (type == 0x81d) {
            this.context.__address__ = address.add(8);
            mainHandler.call(this, this.context, '__address__');
        }
        // else {
        //     console.log(hexdump(this.context.eax, {length: 0x30}));
        // }
    });
}

function scanSync(ranges, pattern) {
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const results = Memory.scanSync(range.base, range.size, pattern);
        if (results.length !== 0) {
            return results;
        }
    }

    return [];
}