// ==UserScript==
// @name         Spiritfarer: Farewell Edition
// @version      
// @author       [DC]
// @description  Steam
// * Thunder Lotus Games
// * Unity (JIT)
//
// https://store.steampowered.com/app/972660/Spiritfarer_Farewell_Edition/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 500);

// private void ChangeTextIndex(int index, ConversationBubble bubble, Conversation conversation)
/*
Mono.setHook('', '.ConversationManager', 'ChangeTextIndex', -1, {
    onEnter(args) {
        if (args[3].isNull() === true) {
            return;
        }

        console.log('onEnter: ConversationManager.ChangeTextIndex');
        this.bubble = args[2].wrap();
    },
    onLeave() {
        const s = this.bubble._text.wrap().get_text().readMonoString().replace(/<.*?>/g, '');
        handlerLine(s);
    }
}); //*/
// public IEnumerator ScrollText(ConversationBubble bubble, float overrideScrollSpeed = -1f)
Mono.setHook('', '.ConversationManager', 'ScrollText', -1, {
    onEnter(args) {
        console.log('onEnter: ConversationManager.ScrollText');
        const bubble = args[1].wrap();
        const s = bubble._text.wrap().get_text().readMonoString().replace(/<.*?>/g, '');
        handlerLine(s);
    }
});

// protected virtual void UpdateDisplay(ItemStack stack)
Mono.setHook('', '.ItemDescriptionPiece', 'UpdateDisplay', -1, {
    onEnter(args) {
        if (args[1].isNull() === true) {
            return;
        }
        console.log('onEnter: ItemDescriptionPiece.UpdateDisplay');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        try {
            const title = this.thiz._itemNameText.wrap().get_text().readMonoString();
            const desc = this.thiz._itemDescriptionText.wrap().get_text().readMonoString().replace(/<.*?>/g, '');
            const s = title + '\r\n' + desc;
            handlerLine(s);
        }
        catch { }
    }
});

// public void ActivateHint(HintType hint, HintDisplayOptions options)
Mono.setHook('', '.DynamicHintSystem', 'ActivateHint', 2, {
    onEnter(args) {
        this.thiz = args[0].wrap();
    },
    onLeave() {
        setTimeout(() => {
            if (this.thiz._currentlyShowing.getValue().isNull() === true) {
                return;
            }
            console.log('onEnter: DynamicHintSystem.ActivateHint');
            const s = this.thiz._screenSpaceText.wrap().get_text().readMonoString();
            handlerLineLast(s);
        }, 100);
    }
});

{
    let hook = null;
    Mono.setHook('', '.ChoiceInteractionResponse', 'OnInteractionStart', -1, {
        onEnter(args) {
            console.log('onEnter: ChoiceInteractionResponse');
            hook = Mono.setHook('', '.LocalizedUIText', 'UpdateText', -1, {
                onEnter(args) {
                    console.log('onEnter: LocalizedUIText.UpdateText');
                    this.thiz = args[0].wrap();
                },
                onLeave() {
                    const s = this.thiz.text.wrap().get_text().readMonoString().replace(/<.*?>/g, '');
                    handlerLine(s);
                }
            });
        }
    });

    Mono.setHook('', '.ChoiceInteractionResponse', 'OnInteractionEnd', -1, {
        onEnter(args) {
            if (hook !== null) {
                hook.detach();
                hook = null;
            }
        }
    });
}
{
    let hook = null;
    Mono.setHook('', '.InteractionMenuResponse', 'OnInteractionStart', -1, {
        onEnter(args) {
            console.log('onEnter: InteractionMenuResponse');
            hook = Mono.setHook('', '.LocalizedUIText', 'UpdateText', -1, {
                onEnter(args) {
                    console.log('onEnter: LocalizedUIText.UpdateText');
                    this.thiz = args[0].wrap();
                },
                onLeave() {
                    const s = this.thiz.text.wrap().get_text().readMonoString().replace(/<.*?>/g, '');
                    handlerLine(s);
                }
            });
        }
    });

    Mono.setHook('', '.InteractionMenuResponse', 'OnInteractionEnd', -1, {
        onEnter(args) {
            if (hook !== null) {
                hook.detach();
                hook = null;
            }
        }
    });
}

// // .SaveGame GetMapInfoLinks (string destination) System.Collections.Generic.IEnumerator<SavedMapInfoLink>
// Mono.setHook('', '.SaveGame', 'GetMapInfoLinks', -1, {
//     onEnter(args) {
//         handlerLineLast(args[1].readMonoString());
//     },
// });