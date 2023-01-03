// ==UserScript==
// @name         Nobody - The Turnaround
// @version      
// @author       [DC]
// @description  Steam
// * U.Ground Game Studio
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/1810580/Nobody__The_Turnaround/
// ==/UserScript==

const Mono = require('./libMono.js');
const {
    setHook,
    _module
} = Mono;

let set = new Set(), timerDialog;
let previous = '';
function processText(s, ctx) {
    if (previous.includes(s) !== true) {
        set.add(s);
    }
    clearTimeout(timerDialog);
    timerDialog = setTimeout(function () {
        const finalStr = [...set].join('\r\n');
        previous = finalStr;
        set = new Set();
        trans.send(finalStr);
    }, 250);
}

let setUI = new Set(), timerUI;
function processUI(s, ctx) {
    s = s.replace(/<[^>]+./g, ''); // trim html tag
    setUI.add(s);
    clearTimeout(timerUI);
    timerUI = setTimeout(function () {
        const finalStr = [...setUI].join('\r\n');
        setUI = new Set();
        console.log('---');
        trans.send(finalStr);
    }, 150);
}

/* Hook1: Dialogue */
setHook('', '.LanguageTools', 'GetDialogLanguage', -1, {
    onLeave(retVal) {
        const ctx = this.returnAddress.sub(_module.base);

        console.log('onEnter: LanguageTools.GetDialogLanguage', ctx, ctx.add(0x180000000));
        const s = retVal.readMonoString();
        processText(s, ctx);
    }
});

/* Hook2: UI+... */
let previousLang = '';
setHook('', '.LanguageTools', 'GetLanguage', -1, {
    onLeave(retVal) {
        const ctx = this.returnAddress.sub(_module.base);

        console.log('onEnter: LanguageTools.GetLanguage', ctx, ctx.add(0x180000000));
        const s = retVal.readMonoString();
        if (previousLang !== s) {
            previousLang = s;
            processUI(s, ctx);
        }
    }
});

setHook('', '.LanguageTools', 'GetUIText', -1, {
    onLeave(retVal) {
        const ctx = this.returnAddress.sub(_module.base);

        console.log('onEnter: LanguageTools.GetUIText', ctx, ctx.add(0x180000000));
        const s = retVal.readMonoString();
        if (s !== '[   Next]') {
            processUI(s, ctx);
        }
    }
});
