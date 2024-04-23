// ==UserScript==
// @name         Bunny Garden
// @version      
// @author       Koukdw
// @description  Steam
// * qureate	
// * Unity (JIT)
//
// https://store.steampowered.com/app/2654470/BUNNY_GARDEN/
// ==/UserScript==
const Mono = require('./libMono.js');


const handlerLineFirst = trans.send(handler, -250);
const handlerLineLast = trans.send(handler, 250);
const handlerLine = trans.send(handler, '250+');

Object.prototype.getTextLabelString = function () {
    return this.m_text.wrap().get_text().readMonoString();
}

function handler(s) {
    return s.replaceAll('<BR>', '\n')
}



Mono.setHook('', 'GB.ConversationWindow', 'updateText', -1, {
    onEnter(args) {
        //console.log('onEnter: ConversationWindow.updateText');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        const thiz = this.thiz;
        const ConversationWindowPanel = thiz.m_window.wrap();

        const name = ConversationWindowPanel.m_nameText.wrap().getTextLabelString();
        const text = ConversationWindowPanel.m_text.wrap().getTextLabelString();

        handlerLineLast(`${name} \n ${text}`);
    }
});


// System.Void GB.TutorialWindow::updateFooter(System.Boolean)
Mono.setHook('', 'GB.TutorialWindow', 'updateFooter', -1, {
    onEnter(args) {
        //console.log('onEnter: TutorialWindow.updateFooter');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        const thiz = this.thiz;
        const tutorialitems = thiz.m_tutorialItems.wrap().ToArray().value;
        const selected = thiz.m_select.value;

        const titleText = thiz.m_titleText.wrap().getTextLabelString();
        const description = tutorialitems[selected].wrap().m_description.wrap().getTextLabelString();

        handlerLineLast(`${titleText} \n --------------------- \n ${description}`);
    }
});

//System.Void GB.Bar.PurchasableItemSelector::move(System.Int32)
Mono.setHook('', 'GB.Bar.PurchasableItemSelector', 'move', -1, {
    onEnter(args) {
        //console.log('onEnter: PurchasableItemSelector.move');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        const thiz = this.thiz;
        const description = thiz.m_description.wrap().getTextLabelString();
        const purchasableItems = thiz.m_purchasableItems.wrap().ToArray().value;
        const selected = thiz.m_select.value;

        const name = purchasableItems[selected].wrap().m_name.wrap().getTextLabelString();
        const price = purchasableItems[selected].wrap().m_price.wrap().getTextLabelString();

        handlerLineLast(`${name} - ${price} \n -------------------- \n ${description}`);
    }
});


// System.Void GB.ConfirmDialog::SetText(GB.MSGID)
Mono.setHook('', 'GB.ConfirmDialog', 'SetText', -1, {
    onEnter(args) {
        //console.log('onEnter: ConfirmDialog.SetText');
        this.thiz = args[0].wrap();
    },
    onLeave() {
        const thiz = this.thiz;

        const text = thiz.m_text.wrap().getTextLabelString();

        handlerLineLast(`${text}`);
    }
});


const ConversationChoiceItem_Setup = Mono.use('', 'GB.ConversationChoiceItem').Setup;
// System.Void GB.ConversationChoice::Enter(GB.MSGID,GB.MSGID)
Mono.setHook('', 'GB.ConversationChoice', 'Enter', -1, {
    onEnter(args) {
        this.thiz = args[0];
        this.hook_setup = ConversationChoiceItem_Setup.attach({
            onEnter(args) {
                this.thiz = args[0].wrap();
            },
            onLeave() {
                const thiz = this.thiz;
                const text = thiz.m_text.wrap().getTextLabelString();

                handlerLine(`${text}`);
            }
        })
    },
    onLeave() {
        this.hook_setup.detach();
    }
});

//System.Void GB.Home.ShopItem::OnEnter(UnityEngine.EventSystems.PointerEventData)
Mono.setHook('', 'GB.Home.ShopItem', 'OnEnter', -1, {
    onEnter(args) {
        const thiz = args[0].wrap();

        const name = thiz.m_name.wrap().getTextLabelString();
        const price = thiz.m_value.wrap().getTextLabelString();

        handlerLineLast(`${name} - ${price}`);
    },
});



// System.String GB.MessageManager::RefText(GB.MSGID,System.Int32)
// Mono.setHook('', 'GB.MessageManager', 'RefText', -1, {
//     onLeave(ret) {
//         //console.log('onEnter: MessageManager.RefText');

//         const s = ret.readMonoString();

//         handlerLineFirst(s);
//     }
// });



// Good but trigger on backlog mouseover
//System.Void GB.ConversationWindowPanel::Set(GB.MSGID,GB.MSGID,System.Int32,UnityEngine.Color,UnityEngine.Color,GB.ConversationWindowPanel/PanelType)
// Mono.setHook('', 'GB.ConversationWindowPanel', 'Set', -1, {
//     onEnter(args) {
//         //console.log('onEnter: ConversationWindowPanel.Set');
//         this.thiz = args[0].wrap();
//     },
//     onLeave() {
//         const thiz = this.thiz;
//         const name = thiz.m_nameText.wrap().m_text.wrap().get_text().readMonoString();
//         const text = thiz.m_text.wrap().m_text.wrap().get_text().readMonoString();
//         handlerLine(`${name} \n ${text}`);
//     }
// });