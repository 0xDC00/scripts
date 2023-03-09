// ==UserScript==
// @name         Pentiment
// @version      
// @author       [DC]
// @description  Steam
// * Obsidian Entertainment
// * Unity (il2cpp)
//
// https://store.steampowered.com/app/1205520/Pentiment/
// ==/UserScript==
const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 500);
/*
(
    Game.GameData.SpeechSettingsGameData speaker,
    string textToSay,
    string iconString,
    System.Single widthModifier,
    System.Boolean fastAnim
)
*/
/** @type {Mono.InvocationListenerCallbacksMono} */
const probe = {
    onEnter(args) {
        console.warn('onEnter SetText');
        const textToSay = args[2];
        const s = textToSay.readMonoString().replace(/<.*?>/g, '');
        handlerLine(s);
    }
};
Mono.setHook('', 'Game.StrokedTextController', 'SetText', -1, probe);
Mono.setHook('', 'Game.PrintedTextController', 'SetText', -1, probe);

// (Game.Character speaker)
Mono.setHook('', 'Game.UI.BaseDialogueBubble', 'UpdateNameplateForSpeaker', -1, {
    onEnter(args) {
        console.warn('onEnter SetName');
        const speaker = args[1];
        if (speaker.isNull() !== true) {
            const s = speaker.wrap().GetName().readMonoString();
            handlerLine(s === '*Missing string -1*' ? 'Andreas' : s);
        }
    }
});

// (UnityEngine.EventSystems.BaseEventData eventData)
Mono.setHook('', 'Game.BigChoiceSelection', 'OnSelect', -1, {
    onEnter(args) {
        console.warn('onEnter OnSelect');
        const thiz = args[0].wrap();
        const m_pageText = thiz.m_pageText.wrap().get_text().readMonoString();
        const m_descriptionText = thiz.m_descriptionText.wrap().get_text().readMonoString();
        const s = m_pageText + '\r\n' + m_descriptionText;
        handlerLineLast(s.replace(/<.*?>/g, ''));
    }
});