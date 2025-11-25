// ==UserScript==
// @name         Mahou Shoujo no Majo Saiban
// @version      
// @author       emilybrooks
// @description  Steam
// * Acacia
// * Unity (il2cpp)
//
// https://store.steampowered.com/app/3101040/
// ==/UserScript==
const ui = require("./libUI.js");
const Mono = require('./libMono.js');

let hookEnabledDebate = true;

Mono.setHook('Elringus.Naninovel.Runtime', 'Naninovel.UI.RevealableText', 'SetTextValue', 1,
{
    onEnter(args)
    {
        // console.log("Naninovel.UI.RevealableText SetTextValue()");
        let text = args[1].readMonoString();
        text = text.replace(/<.*?>/g, ''); // remove control codes
        trans.send(text);
    }
});

// debate text is separated line by line, so use this to combine them.
const combineSend = trans.send((s) => s, '10++');

Mono.setHook('Assembly-CSharp', 'WitchTrials.Views.DebateText', 'ProcessText', 1,
{
    onEnter(args)
    {
        if (!hookEnabledDebate)
        {
            return;
        }
        // console.log("WitchTrials.Views.DebateText ProcessText()");
        let text = args[1].readMonoString();
        text = text.replace(/<.*?>/g, ''); // remove control codes
        // filter out Label 1 Label 2 etc
        if (text.includes("Label"))
        {
            return;
        }
        combineSend(text);
    }
});

// Mono.setHook('Assembly-CSharp', 'WitchTrials.Views.WitchBookItemSubjectLabel', 'SetText', 1,
// {
//     onEnter(args)
//     {
//         console.log("WitchTrials.Views.WitchBookItemSubjectLabel SetText()");
//         let text = args[1].readMonoString();
//         // text = text.replace(/<.*?>/g, ''); // remove control codes
//         trans.send(text);
//     }
// })

// Mono.setHook('', 'WitchTrials.Views.CluePage', 'RefreshPageContent', 1,
// {
//     onEnter(args)
//     {
//         console.log("WitchTrials.Views.CluePage RefreshPageContent()");
//         let test = args[1].wrap().Item.wrap().Description.wrap();

//         console.log(test);
//     }
// });

// Mono.setHook('', 'WitchTrials.Views.ProfilePage', 'RefreshPageContent', 1,
// {
//     onEnter(args)
//     {
//         console.log("WitchTrials.Views.ProfilePage RefreshPageContent()");
//         let test = args[1].wrap().Item.wrap().Description.wrap();
//         // for some reason localizedtext is always null? can't figure this out
//         console.log(test);
//     }
// });

ui.title = "Mahou Shoujo no Majo Saiban";
ui.description = /*html*/ `Configure which hooks are enabled.`;

ui.options =
[
    {
        id: "debateText",
        type: "checkbox",
        label: "Debate Text",
        help: `In debates, the same text is repeated until you find the right answer, and can be fast forwarded. If you track stats while reading, you might want to disable this.`,
        defaultValue: true,
    },
];

ui.onchange = (id, current, previous) =>
{
    if (id === "debateText")
    {
        hookEnabledDebate = current;
    }
};

ui.open();
