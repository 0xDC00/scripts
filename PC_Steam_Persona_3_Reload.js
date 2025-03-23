// ==UserScript==
// @name         Persona 3 Reload
// @version      0.1
// @author       Koukdw
// @description  Steam+Gamepass
// * Atlus
// * Unreal Engine 4.27
// ==/UserScript==
const __e = Process.enumerateModules()[0];

const mainHandler = trans.send(handler, '200+');
const mainHandler2 = trans.send(handler, '50+');
const choiceHandler = trans.send(handlerPrompt);

const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');

const IS_DEBUG = false;

const choices = new Set();
var timerChoice;

let patterns = {
    // Main text (dialogue, help text content, system prompt content, dictionnary etc..)
    // mainText: "89 ?? ?? 43 0F B6 14 08",
    mainText: "43 0FB6 14 08 85 D2", // moved forward one instruction

    // Secondary text (Title, Names, Headings)
    // secondaryText: "8B 15 ???????? 81 EA ???????? 48 89 ?? 24 ?? b9",
    secondaryText: "48 89 83 90 00 00 00 48 8B 0E", // moved forward after nop in latest

    // Choice text (and variants)
    choiceText: "48 89 43 20 48 89 D9",

    // Used for inserting text
    difficulty1: "48 8d ?? ?? ?? ?? ?? 48 8b 3c c7", // lea
    difficulty2: "e8 ?? ?? ?? ?? 4? 8b ?? ?? 4? 8b ?? 4? 85 ?? 74 ?? 4? 83", // lea was replaced with call in latest
}

console.log(`
Supported (Non exhaustive, i need some test to know that):
* Self dialogue (Mind)
* Dialogue
* Name
* Choice <- Not perfect but good enough
* Help prompt
* System prompt
* Dictionnary
* Maybe more stuff

Unsupported yet:
* ???

Known issue:
* Like all the other persona script, there's problem getting back text generated by user choice like
Difficulty and Username. I'm looking at a way to get them back we'll see if i can find something.

Tips:
Set "IS_DEBUG" to false in the script if you don't want debugging information, i recommend leaving it on, so i can help
if there is a problem with the script.
This debugging text isn't copied to the clipboard, so you can use a texthooking page it won't show up.
`);

console.warn(`DEBUGGING: ${IS_DEBUG ? "ON" : "OFF"}`);

function getDifficultySearchAddress() {
    const results = Memory.scanSync(__e.base, __e.size, patterns.difficulty1);
    if (results.length === 0) {
        return null;
    } else if (results.length > 1) {
        console.warn(`DifficultySearchAddress1 has ${results.length} results`);
    }

    const difficultySearchAddress = results[results.length - 1].address;

    return difficultySearchAddress;
}

function getDifficultySearchFallbackAddress() {
    const results = Memory.scanSync(__e.base, __e.size, patterns.difficulty2);
    if (results.length === 0) {
        return null;
    } else if (results.length > 1) {
        console.warn(`DifficultySearchAddress2 has ${results.length} results`);
    }

    // call procedure
    let ins = Instruction.parse(results[0].address);    // call P3R.exe+125C650

    // follow the call
    ins = Instruction.parse(ptr(ins.opStr));            // movsxd  rax,ecx
    ins = Instruction.parse(ins.next);                  // lea rcx,[P3R.exe+5686690]

    if (ins.mnemonic !== "lea") {
        console.error(`Unexpected instruction: ${ins.mnemonic}`);
        return null;
    }

    const difficultySearchFallbackAddress = ins.address;

    return difficultySearchFallbackAddress;
}


let difficultySearchAddress = getDifficultySearchAddress();
if (difficultySearchAddress === null) {
    console.log("Trying fallback...");

    difficultySearchAddress = getDifficultySearchFallbackAddress();
    if (difficultySearchAddress === null) {
        console.error("[DifficultyPattern] no result!");
        return;
    }
}
console.log('[DifficultySearchAddress] @ ' + difficultySearchAddress);

let ins = Instruction.parse(difficultySearchAddress);
let difficultyAddress = ins.next.add(ins.operands[1].value.disp);
console.log('[DifficultyAddress] @ ' + difficultyAddress);


(function () {
    const dialogSig = patterns.mainText;
    const results = Memory.scanSync(__e.base, __e.size, dialogSig);
    if (results.length === 0) {
        console.error('[MainTextPattern] no result!');
        return;
    }
    let hookAddress = results[results.length - 1].address
    console.log('[MainTextAddress] @ ' + hookAddress);

    // for (const thing of results) {
    //     console.warn(thing.address);
    // }

    // Breakpoint.add(hookAddress, {
    //     onEnter(args) {
    //         let address = this.context.rax;
    //         mainHandler(address);
    //     }
    // })
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            let address = this.context.r9;
            mainHandler(address);
        },
    })
})();


(function () {
    const nameSig = patterns.secondaryText;
    const results = Memory.scanSync(__e.base, __e.size, nameSig);
    if (results.length === 0) {
        console.error('[SecondaryTextPattern] no result!');
        return;
    }
    let hookAddress = results[results.length - 1].address
    console.log('[SecondaryTextAddress] @ ' + hookAddress);

    // for (const thing of results) {
    //     console.warn(thing.address);
    // }

    // Breakpoint.add(hookAddress, {
    //     onEnter(args) {
    //         let address = this.context.rax;
    //         mainHandler(address);
    //     }
    // })
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            let address = this.context.rdi;
            mainHandler2(address);
        },
    })
})();


(function () {
    const choiceSig = patterns.choiceText;
    const results = Memory.scanSync(__e.base, __e.size, choiceSig);
    if (results.length === 0) {
        console.error('[ChoiceTextPattern] no result!');
        return;
    }
    let hookAddress = results[results.length - 1].address
    console.log('[ChoiceTextAddress] @ ' + hookAddress);
    
    // for (const thing of results) {
    //     console.warn(thing.address);
    // }

    // Breakpoint.add(hookAddress, {
    //     onEnter(args) {
    //         let address = this.context.rax;
    //         mainHandler(address);
    //     }
    // })
    Interceptor.attach(hookAddress, {
        onEnter(args) {
            let address = this.context.rax;
            choiceHandler(address);
        },
    })
})();

//Choices + everything
// (function () {
//     //Interceptor.attach(ptr(0x14BEE3C34), {
//     Interceptor.attach(ptr(0x14BEE3C10), {
//         onEnter(args) {
//             let testVal = this.context.r15;
//             // if(testVal == 0 || testVal > 100) {
//             //     return null;
//             // }
//             console.warn(this.returnAddress);
//             console.warn(JSON.stringify(this.context, null, "\t"));
//             let address = args[0].add(32).readPointer();
//             //let address = this.context.r8;
//             //mainHandler2(address);
//             console.log(handler2(address));
//         },
//     })
// })();



//Gamepass 0x14BEF599D
(function () {
    if(IS_DEBUG) {
        // Print command and address for debugging
        const dbgSig = '41 ff d2 8b ?? ?? 41';
        const results = Memory.scanSync(__e.base, __e.size, dbgSig);
        if (results.length === 0) {
            console.error('[DbgPattern] no result!');
            return;
        }
        let hookAddress = results[results.length - 1].address
        console.log('[DbgAddress] @ ' + hookAddress);

        // for (const thing of results) {
        //     console.warn(thing.address);
        // }
        
        // Breakpoint.add(hookAddress, {
        //     onEnter(args) {
        //         const command = this.context.rcx;
        //         const address = this.context.r10;
        //         console.log(`command ${ptr(command)} -> ${ptr(address)}`);
        //     }
        // })
        Interceptor.attach(hookAddress, {
            onEnter(args) {
                const command = this.context.rcx;
                const address = this.context.r10;
                console.log(`command ${ptr(command)} -> ${ptr(address)}`);
            },
        })
    }
})();

function handler(address) {
    if(IS_DEBUG){
        console.log(hexdump(address));
    }
    let s = readString(address);
    s = s.replace(/\r|\n/g, '');
    return s;
}

let last_text = '';
function handler2(address) {
    if(IS_DEBUG){
        console.log(hexdump(address));
    }
    let s = readString(address);
    s = s.replace(/\r|\n/g, '');
    if (s === last_text) return null;
    last_text = s;
    return s;
}

function handlerPrompt(address) {
    const s = handler.call(this, address);
    choices.add(s);

    clearTimeout(timerChoice);
    timerChoice = setTimeout(() => {
        const s = [...choices].join('\r\n');
        trans.send(s);
        choices.clear();
    }, 300);
}

// Todo: Figure out f5 84 (items) and f1 83 (player name)
function readString(address) {
    let s = '', c;
    while ((c = address.readU8()) !== 0) { // terminated
        if(c === 0xFE) { // 0xFE Command start bytecode
            address = address.add(1); 
            c = address.readU8();
            const cmd = address.add(1).readU8();
            const size = (c & 0x0F) * 2; // (F1 -> 2), (F2 -> 4), (F3 -> 6), (F4 -> 8) etc.. (need more test on higher numbers)
            if (cmd === 0x21 || cmd === 0x22) { // f121 and f222 <= end of sentence
                address = address.add(size);
                return s;
            }
            // f2 44 01 01
            if (cmd === 0x44) { 
                const index = address.add(2).readU8() - 1; // 1 byte?
                const word = difficultyAddress.add(index * 8).readPointer().readCString();
                s += word;
                //...
            }

            // f1 83
            // if(cmd == 0x83) {
            //     ...
            // }


            // f5 84 01 01 26 01 02 01 02 51
            // Not working
            // if (cmd === 0x84) {
            //     console.warn("Interesting command here");
            //     //const index = address.add(2+6).readU8() - 1; // 1 byte?
            //     const word = ptr(0x1456c74b0).readPointer().readCString();
            //     s += word;
            // }

            address = address.add(size);
        }
        else if (c < 0xF0){ // Read character and add them to text
            c = decoder.decode(address.readByteArray(4))[0]; // utf-8: 1->4 bytes.
            s += c;
            address = address.add(encoder.encode(c).byteLength);
        }
        else  {
            // add 1 to not get stuck if something unexpected happen
            // it shouldn't happen tho
            address = address.add(1);
        }
    }
    return s; //Used when there's no text in the bytecode, otherwise it print error because we try to read a null string in the handler.
}
