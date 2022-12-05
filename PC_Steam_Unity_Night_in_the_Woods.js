// ==UserScript==
// @name         Night in the Woods
// @version      
// @author       [DC]
// @description  Steam
// * Infinite Fall
// * Unity (JIT)
//
// https://store.steampowered.com/app/481510/Night_in_the_Woods/
// ==/UserScript==

const Mono = require('./libMono.js');
const {
    setHook
} = Mono;

const handlerLine = trans.send((s) => s, '250+');

////// RAW: Line+Options (confuse)
//// public string GetString(string key)
// setHook('', 'Yarn.Program', 'GetString', -1, {
//     onLeave: (ret) => {
//         console.log('onEnter: Program.GetString');
//         const s = ret.readMonoString();
//         handlerLine(s);
//     }
// });

//// OR
// public IEnumerator RunLine(string line)
//     public IEnumerator Say(string characterName, string line) // FORMATED
setHook('', '.DialogueImplementation', 'Say', -1, {
    onEnter: function (args) {
        console.log('onEnter: DialogueImplementation.RunLine');
        const name = args[1].readMonoString();
        const line = args[2].readMonoString();
        //const s = name + ': ' + line + ' ';
        const s = name + ': ' + line;
        handlerLine(s);
    }
});

// System.Collections.Generic.List<System.String>
var listStringGetItem = null;
var listStringGetCount = null;
const argsZ = Memory.alloc(8 + 8);
const args0 = argsZ.add(8);
argsZ.writePointer(args0);

// public IEnumerator RunOptions(DialogueUI dialogueUI, List<string> options)
setHook('', '.DialogueImplementation', 'RunOptions', -1, {
    onEnter: (args) => {
        console.log('onEnter: DialogueImplementation.RunOptions');
        if (listStringGetItem === null) {
            const obj = args[2].wrap(); //obj.$dump();
            listStringGetItem = obj.get_Item;
            listStringGetCount = obj.get_Count;
        }

        const options = args[2];
        const N = listStringGetCount(options).unbox().readS32();
        for (let i = 0; i < N; i++) {
            args0.writeS32(i);
            const item = listStringGetItem(options, argsZ).readMonoString();
            const s = ' - ' + item;
            handlerLine(s);
        }
    }
});
