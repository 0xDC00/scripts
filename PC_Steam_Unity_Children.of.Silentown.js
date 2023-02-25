// ==UserScript==
// @name         Children of Silentown
// @version      
// @author       [DC]
// @description  Steam
// * Elf Games Works, Luna2 Studio
// * Unity (JIT)
//
// https://store.steampowered.com/app/1108000/Children_of_Silentown/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');

// public void PrepareDialogue(GameObject speaker, string newText, bool thinking, Vector2 offset)
Mono.setHook('', 'Game.UI.BalloonMessageController', 'PrepareDialogue', -1, {
    onEnter(args) {
        console.log('onEnter: BalloonMessageController.PrepareDialogue');

        const s = args[2].readMonoString();

        handlerLine(s);
    }
});

// public IEnumerator SetNarrator(string message, NarratorOptions options = null)
Mono.setHook('', 'Game.UI.MessageFacade', 'SetNarrator', -1, {
    onEnter(args) {
        console.log('onEnter: SetNarrator');

        const s = args[1].readMonoString();

        handlerLine(s);
    }
});

// public IEnumerator Show(string message, NarratorOptions options = null)
Mono.setHook('', 'Game.UI.NarratorController', 'Show', -1, {
    onEnter(args) {
        console.log('onEnter: NarratorController.Show');

        const s = args[1].readMonoString();

        handlerLine(s);
    }
});

// public IEnumerator ShowOnScreen(string text, Spotlight[] spotlights, GameEventBus.EventNames expectedEvent, Params options = null)
Mono.setHook('', 'Game.UI.TutorialManager', 'ShowOnScreen', -1, {
    onEnter(args) {
        console.log('onEnter: TutorialManager.ShowOnScreen');

        const s = args[1].readMonoString();

        handlerLine(s);
    }
});

// public IEnumerator ShowRoutine(string text, InventoryDatabase.ICollectible inventoryItem, Params parameters = null)
Mono.setHook('', 'Game.UI.Dialog.DialogPopup', 'ShowRoutine', -1, {
    onEnter(args) {
        console.log('onEnter: DialogPopup.ShowRoutine');

        const s = args[1].readMonoString();

        handlerLine(s);
    }
});

// public IEnumerator SetChoice(Dictionary<string, bool> choices)
Mono.setHook('', 'Game.UI.MessageFacade', 'SetChoice', -1, {
    onEnter(args) {
        console.log('onEnter: SetChoice');
        const choices = args[1].wrap();

        for (const item of choices) {
            const s = item.wrap().get_Key().readMonoString();
            handlerLine(s);
        }

        //// another way
        // const iter = choices.GetEnumerator().wrap();
        // while (iter.MoveNext().value === true) {
        //     const pair = iter.get_Current().wrap();
        //     const s = pair.get_Key().readMonoString();
        //     handlerLine(s);
        // }
    }
});

// It's a loop | IEnumerator
// Game.Video.AddressableVideoController
// private IEnumerator HandleSubtitlesAndSoundEffects(AddressableVideoConfiguration configuration)
const TMP_Text = Mono.use('Unity.TextMeshPro', 'TMPro.TextMeshProUGUI'); // TextMeshProUGUI TMP_Text
Mono.setHook('', 'Game.Video.AddressableVideoController', 'HandleSubtitlesAndSoundEffects', -1, {
    onEnter() {
        console.log('onEnter: HandleSubtitlesAndSoundEffects');

        let hookStop;
        let previous = null;
        let hookTMP_Text = TMP_Text.set_text.attach({
            onEnter(args) {
                const thiz = args[0];
                console.log('onEnter: setSubtitle ' + thiz + ' ' + this.returnAddress);

                // HandleVideoEnd
                if (previous === null) previous = thiz;
                else if (thiz.compare(previous) !== 0) {
                    console.log('onEnter: HandleVideoEnd');
                    hookTMP_Text.detach();
                    hookStop.detach();
                    previous = null;
                    return;
                }

                const s = args[1].readMonoString();
                if (s === '') return;

                handlerLine(s);
            }
        });

        // HandleVideoSkipping
        hookStop = Mono.setHook('', 'Game.Video.AddressableVideoController', 'PrepareStopPlayback', -1, {
            onEnter() {
                previous = null;
                console.log('onEnter: PrepareStopPlayback');
                hookTMP_Text.detach();
                hookStop.detach();
            }
        });
    }
});
