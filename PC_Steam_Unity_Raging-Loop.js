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

const BackLog = Mono.use('', '.MainScene$BackLog'); // names + dialog

BackLoggit.attach({
    onEnter(args) {
        const message = args[1].readMonoString();
        handlerLine(message);
    },
})

setHook('', 'Game', 'NewText', -1, { // choices + system text
    onEnter(args) {
        const message = args[3].readMonoString();

        if (message.length > 1) handlerLine(message); // filter out dialog
    }
});
