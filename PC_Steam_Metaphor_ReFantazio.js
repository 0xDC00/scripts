// ==UserScript==
// @name         Metaphor: ReFantazio
// @version      0.1
// @author       Koukdw
// @description  https://store.steampowered.com/app/2679460/Metaphor_ReFantazio/
// * Atlus
// 
// ==/UserScript==


const __e = Process.enumerateModules()[0];

let textSet = new Set();
let timerText
function handlerLine(s) {
    textSet.add(s);

    clearTimeout(timerText);
    timerText = setTimeout(() => {
        const s = [...textSet].join('\r\n');
        trans.send(s);
        textSet.clear();
    }, 250);
}

const hookFilterPatterns = [
    {
        name: 'TextPattern',
        desc: 'Subtitles, dialogue, inner-thought and more...',
        pattern: '90 4C 8D 85 90 00 00 00 33 D2',
        enabled: true
    },
    {
        name: 'NamePattern',
        desc: 'Name associated with the text',
        pattern: '90 48 8B 8D C0 00 00 00 EB 0C',
        enabled: true
    },
    {
        name: 'ChoicePattern',
        desc: 'Choice when a npc ask you a question',
        pattern: '90 48 83 7c 24 60 00',
        enabled: true
    }
];

const addresses = findFilterAddress(hookFilterPatterns);

/**
14140C5B0 (v3 patched exe) 
Tag processing function 
Called for all the text displayed on screen and return tag free text

The good thing is that if we grab the return value we don't have to handle any tag which greatly
simplify our code. Instead we just need to look at the callstack and pick and choose the return address
to allow
*/
const tagFunctionPat = '40 53 48 83 ec 30 45 0f b7 c8';
const results = Memory.scanSync(__e.base, __e.size, tagFunctionPat);
if (results.length === 0) {
    console.error('[tagFunctionPattern] no result!');
    return;
}
const tagFunctionAddr = results[results.length -1].address;
Interceptor.attach(tagFunctionAddr, {
    onEnter(args) {
        // ...
    },
    onLeave(retVal) {
        //const callstack = Thread.backtrace(this.context, Backtracer.FUZZY);
        //console.error(`sp = ${this.returnAddress}`);
        if(shouldNotFilter(this.returnAddress, addresses))
        {
            const address = retVal.readPointer();
            const str_ptr = address.readPointer();
            const str_end_ptr = address.add(8).readPointer();
            const len = str_end_ptr - str_ptr;
            //console.warn(hexdump(str_ptr, { length: 0x100 }))
            let str = str_ptr.readUtf32StringLE(len);
            str = str.replaceAll("\n", " ");
            handlerLine(str);
        }
    }
    
});


function findFilterAddress(hookPatterns) {
    let addresses = [];
    for(let hook of hookPatterns) {
        if(hook.enabled) {
            const results = Memory.scanSync(__e.base, __e.size, hook.pattern);
            if (results.length === 0) {
                console.log(`\x1b[31m[${hook.name}] Filter not found!\x1b[0m`);
            }
            else {
                console.log(`\x1b[32m[${hook.name}] Filter found at ${results[results.length-1].address}!\x1b[0m`);
                addresses.push(results[results.length-1].address);
            }
        }
    }
    return addresses;
}

function shouldNotFilter(callstackAddr, addresses) {
    for(let addr of addresses) {
        if(callstackAddr.equals(addr)) {
            return true;
        }
    }
    return false;
}