// ==UserScript==
// @name         OPUS: Prism Peak
// @version      1.35.4.87_372
// @author       Musi
// @description  Steam
// * SIGONO INC.
// * SHUEISHA GAMES
//
// https://store.steampowered.com/app/1947910/OPUS_Prism_Peak/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');

function send(s) {
    if (s.includes('<sprite')) return;
    s = s.replace(/<font[^>]*>.*?<\/font>/g, '').replace(/<.*?>/g, '');
    if (s !== '') handlerLine(s);
}

Mono.setHook('', 'Mountain.Acting.UIStatementSubGroupSetting', 'Mountain.Acting.IUIStatementSubGroupSetting.GetSpeechWidth', -1, {
    onEnter(args) {
        send(args[0].wrap().actorSpeech.wrap().get_text().readMonoString());
    }
});

Mono.setHook('', 'Mountain.UI.UIBranchOptionView', 'Mountain.UI.IUIBranchOptionView.Init', -1, {
    onEnter(args) {
        send(args[2].readMonoString());
    }
});

Mono.setHook('', 'Mountain.UI.MountainItemPopupView', 'MaskFadeOut', -1, {
    onEnter(args) {
        const thiz = args[0].wrap();
        const name = thiz._locDefaultName.wrap();
        const description = thiz._locDefaultDescription.wrap();
        if (description._state.wrap()._isDirty.value) return;
        send(name._textComponent.wrap().get_text().readMonoString() + '\n' + description._textComponent.wrap().get_text().readMonoString());
    }
});

const bio = new Map();

Mono.setHook('', 'Mountain.UI.UIMemoryBioView', 'UpdateText', -1, {
    onEnter(args) {
        this.key = args[0].toString();
        this.thiz = args[0].wrap();
    },
    onLeave() {
        const s = this.thiz._textController.wrap()._textComponent.wrap().get_text().readMonoString();
        if (bio.get(this.key) === s) return;
        bio.set(this.key, s);
        send(s);
    }
});