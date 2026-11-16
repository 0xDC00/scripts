// ==UserScript==
// @name         Schrödinger's Call
// @version      1.0.2
// @author       Musi
// @description  Steam
// * Acrobatic Chirimenjako
// * SHUEISHA GAMES
//
// https://store.steampowered.com/app/2090390/Schr%C3%B6dingers_Call/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '200+');

const clean = (s) => s.replace(/<br>/g, '\n').replace(/<.*?>/g, '');

for (const cls of ['CharVertUpdater', 'CharVertUVInOutUpdaterBase']) {
    Mono.setHook('UIViewset.Dialogue', `View.LocationView.Views.Text.${cls}`, 'MessageFieldInitialize', -1, {
        onEnter(args) {
            this.thiz = args[0].wrap();
            const name = args[1].wrap().get_DisplayName();
            if (name.isNull()) return;
            const s = clean(name.readMonoString());
            if (s.trim()) handlerLine(s);
        },
        onLeave() {
            handlerLine(clean(this.thiz.get_MessageField().wrap().get_text().readMonoString()));
        }
    });
}

Mono.setHook('ViewAbstract', 'View.DialogueView.Base.NonStockableOptionViewBase$Factory', 'FormatTextWithSize', -1, (args) => {
    handlerLine(clean(args[1].readMonoString()));
});