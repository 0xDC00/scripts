// ==UserScript==
// @name         Phoenix Wright: Ace Attorney Trilogy
// @version      0.1
// @author       aqui
// @description  Steam
// * Capcom
// * Unity (JIT)
//
// https://store.steampowered.com/app/787480/Phoenix_Wright_Ace_Attorney_Trilogy/
// ==/UserScript==
console.log(`
Known bug: If you quit the game without detaching game get stuck so
Please detach before quitting the game
`)
const Mono = require('./libMono.js');
const {
    _module
} = Mono;
const handlerLine = trans.send((s) => s, '250+'); //set to 2000+ if you want dialogue text in a single line for now, but it will cause delays in printing
let stringToPrint = '';
let timeout;

Mono.setHook('', 'MessageText', 'ToString', -1, {
    onLeave(retVal) {
        console.log('onLeave: MessageText:ToString');
        const s = retVal.readMonoString().replace(/<[^>]*>/g, '').trim();
        if (s.length < stringToPrint.length) {
            handlerLine(stringToPrint)
        }
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            handlerLine(stringToPrint)
            stringToPrint = ''
        }, 500)
        stringToPrint = s
    }
});

Mono.setHook('', 'selectPlateCtrl', 'setText', -1, {
    onEnter(args) {
        console.log('onEnter: selectPlateCtrl:setText');
        const s = args[2].readMonoString();
        handlerLine(s)
    }
});


//misc text like menu options
//Mono.setHook('', 'ConvertTextData', 'GetText', -1, {
//    onLeave(retVal) {
//        console.log(retVal.readMonoString());
//    }
//});

//item names
Mono.setHook('', 'recordListCtrl', 'cursorRecord', -1, {
    onEnter(args) {
        console.log('onEnter: recordListCtrl:cursorRecord');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        const thiz = this.thiz;
        const itemName = thiz.icon_name.wrap().get_text().readMonoString();
        handlerLine(itemName)
    }
})

//item descriptions
Mono.setHook('', 'ConvertLineData', 'GetText', -1, {
    onLeave(retVal) {
        console.log('onLeave: ConvertLineData:GetText');
        handlerLine(retVal.readMonoString());
    }
});