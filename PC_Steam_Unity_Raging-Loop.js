// ==UserScript==
// @name         Raging Loop
// @version      
// @author       Enfys
// @description  Steam
// * KEMCO
// * Unity (JIT)
//
// https://store.steampowered.com/app/648100/Raging_Loop/
// ==/UserScript==
const Mono = require('./libMono.js');

const {
    setHook
} = Mono;

const handlerLine = trans.send((s) => s, '250+');

setHook('', 'Message', 'Mes', -1, { // dialog + names
    onEnter(args) {
        this.thiz = args[0].wrap();
    },
    onLeave() {
        try {
            const lastMessage = this.thiz.LastMes.getValue().readMonoString();
            const messageText = this.thiz.MessageText.getValue().readMonoString();
            const s = lastMessage.replace(/(\n|　)+/g, '');
            
            // delay dialog past name
            messageText.includes("@n") ? setTimeout(() => handlerLine(s), 100) : handlerLine(s); 
        }
        catch {
        }
    }
});

// setHook('', 'Game', 'NewButton', -1, { // access error when calling for certain UI buttons
//     onEnter(args) {
//         console.log('on new button enter');
//      },
//      onLeave() {
//     }
// });

setHook('', 'Game', 'NewText', -1, { // choices + system text
    onEnter(args) {
        const s = args[3].readMonoString();

        if (s.length > 1) handlerLine(s) // filter out dialog
    }
});
