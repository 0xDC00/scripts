// ==UserScript==
// @name         As Dusk Falls
// @version      
// @author       [DC]
// @description  Steam
// * INTERIOR/NIGHT
// * Unity (IL2CPP)
//
// https://store.steampowered.com/app/1341820/As_Dusk_Falls/
// ==/UserScript==
const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '100+');

/* subtitle */
// public void DisplaySubtitle(List<string> textLines, float clipDuration)
Mono.setHook('', 'InteriorNight.SubtitlesManager', 'DisplaySubtitle', -1, {
    onEnter(args) {
        console.warn('onEnter: SubtitlesManager.DisplaySubtitle');

        const lines = [];
        const textLines = args[1].wrap().ToArray().value;
        for (const line of textLines) {
            lines.push(line);
        }
        const s = lines.join(' ');
        if (s.length === 0) {
            return;
        }
        handlerLine(s);
    }
});
// public void DisplayBackgroundSubtitle(List<string> textLines, float clipDuration)
Mono.setHook('', 'InteriorNight.SubtitlesManager', 'DisplayBackgroundSubtitle', -1, {
    onEnter(args) {
        console.warn('onEnter: SubtitlesManager.DisplayBackgroundSubtitle');

        const lines = [];
        const textLines = args[1].wrap().ToArray().value;
        for (const line of textLines) {
            lines.push(line);
        }
        const s = lines.join(' ');
        if (s.length === 0) {
            return;
        }
        handlerLine(s);
    }
});

//// public void DisplayCloseCaption(string text, float clipDuation)
// Mono.setHook('', 'InteriorNight.SubtitlesManager', 'DisplayCloseCaption', -1, {
//     onEnter(args) {
//         console.warn('onEnter: SubtitlesManager.DisplayCloseCaption');

//         const s = args[1].readMonoString();
//         console.error(s);
//     }
// }); // not use
//// public static string GetCloseCaptionWithIdAsSingleString(string _entryId, bool returnMissingStringIfNotFound = true)
// Mono.setHook('', 'InteriorNight.VOLocalisationDatabase', 'GetCloseCaptionWithIdAsSingleString', -1, {
//     onLeave(retVal) {
//         console.warn('onEnter: VOLocalisationDatabase.GetCloseCaptionWithIdAsSingleString');

//         const s = retVal.readMonoString();
//         console.error(s);
//     }
// }); // non-stop (not need)

// Mono.setHook('', 'InteriorNight.SubtitleLine', 'SetText', -1, {
//     onEnter(args) {
//         console.warn('onEnter: SubtitleLine.SetText', this.returnAddress, this.returnAddress.sub(Mono._module.base).add(0x180000000));

//         const s = args[1].readMonoString();
//         if (s.length === 0) {
//             return;
//         }
//         handlerLine(s);
//     }
// }); // many, split

/* Choice */
// public void SetText(string _text, BaseOption.EType _type)
Mono.setHook('', 'InteriorNight.ChoiceTextController', 'SetText', -1, {
    onEnter(args) {
        console.warn('onEnter: ChoiceTextController.SetText');

        const s = args[1].readMonoString().replace(/\*\^|\*|\^/g, ' ');
        if (s.length === 0) {
            return;
        }
        handlerLine('- ' + s);
    }
});

/* Hidden choice (hover) */
//// public static void OptionFound(string _optionName, int _playerID, float _time)
// Mono.setHook('', 'InteriorNight.GameTracker', 'OptionFound', -1, {
//     onEnter(args) {
//         console.warn('onEnter: GameTracker.OptionFound');

//         const s = args[0].readMonoString().replace(/\*\^|\*|\^/g, ' ');
//         if (s.length === 0) {
//             return;
//         }
//         handlerLine(s);
//     }
// });
//// public void Show(float _time = 0.5f)
// Mono.setHook('', 'InteriorNight.ChoiceComponentAlphaController', 'Show', -1, {
//     onEnter(args) {
//         console.log('onEnter: ChoiceComponentAlphaController.Show');

//         //args[0].wrap().$dump();
//     }
// });