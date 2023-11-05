// ==UserScript==
// @name         Phoenix Wright: Ace Attorney Trilogy
// @version      0.2
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
const handlerLine = trans.send((s) => s, '250+');
let lines = [];
let lastLine = ''
let timeout;

// missing on the first game: text from the buttons in investigation mode (like where to go), character names

Mono.setHook('', 'MessageText', 'ToString', -1, {
    onLeave(retVal) {
        console.log('onLeave: MessageText:ToString');
        const s = retVal.readMonoString().replace(/<[^>]*>/g, '').trim();
        if (s.length < lastLine.length) {
            lines.push(lastLine)
        }
        lastLine = s
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            handlerLine(lines.join("") + lastLine)
            lines = []
            lastLine = ""
        }, 250)
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
