// ==UserScript==
// @name         Urban Myth Dissolution Center
// @version      
// @author       tera8m4
// @description  Steam
// * Hakababunko
// * Unity (JIT)
//
// https://store.steampowered.com/app/2089600/Urban_Myth_Dissolution_Center/
// ==/UserScript==

const Mono = require('./libMono.js');
const {
    _module
} = Mono;

// conversation
Mono.setHook('', 'AC.Speech', '.ctor', 8, {
    onEnter(args) {
        let text = args[2].readMonoString()
            // remove furigana
            .replace(/<r=[^>]*>([^<]*)<\/r>/g, '$1')
            // remove any remaining HTML tags
            .replace(/<.*?>/g, '')
            // remove square bracket text like [hold]
            .replace(/\[[^\]]*\]|<[^>]*>/g, '');
        trans.send(text);
    }
});

// choices
Mono.setHook('', 'ConversationChoiceScroller', 'SetUpChoices', 2, {
    onEnter(args) {        
        const newOptions = args[1].wrap().ToArray().value;
        const oldOptions = args[2].wrap().ToArray().value;

        const choices = [];

        for (let i = 0; i < newOptions.length; ++i) {
            const choice = newOptions[i].wrap();
            const text = choice.label.wrap().ToString().readMonoString(); 
            choices.push(`${choices.length + 1}. ${text}`);
        }

        for (let i = 0; i < oldOptions.length; ++i) {
            const choice = oldOptions[i].wrap();
            const text = choice.label.wrap().ToString().readMonoString(); 
            choices.push(`${choices.length + 1}. ${text}`);
        }

        trans.send(choices.join('\r\n'));
    }        
});

// sns posts
Mono.setHook('', 'SNSPostGroupView', 'ChangeSelectedState', 1, {
    onEnter(args) {
        if (args[1] == 0) { return; }

        const thiz = args[0].wrap();
        let text = "";
        if (thiz.postView.wrap().gameObject.wrap().activeSelf.wrap().value)
        {
            text = thiz.postView.wrap().bodyText.wrap().m_text.wrap().ToString().readMonoString();
        }
        else
        {
            text = thiz.replyView.wrap().bodyText.wrap().m_text.wrap().ToString().readMonoString();
        }
        trans.send(text);
    },
});