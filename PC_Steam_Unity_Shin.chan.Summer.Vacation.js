// ==UserScript==
// @name         Shin chan: Summer Vacation
// @version      
// @author       [DC]
// @description  Steam
// * Neos Corporation
// * Unity (il2cpp)
//
// https://store.steampowered.com/app/2061250/Shin_chan_Me_and_the_Professor_on_Summer_Vacation_The_Endless_SevenDay_Journey/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');

const Enum = Mono.use('System.Enum');
const CharacterType = Mono.use('', 'Ola.CharacterType');
let _characterType = Enum.Parse(CharacterType.value, "ShinChan");
const _characterTypeOffset = _characterType.unbox().sub(_characterType).toInt32();
function characterTypeToString(value) {
    if (value.isNull() === true) return '';
    _characterType = Enum.Parse(CharacterType.value, "ShinChan");
    _characterType.add(_characterTypeOffset).writePointer(value);
    return Enum.ToString.call(_characterType).readMonoString();
}

// public void Play(string text, PopupConstants.WindowType windowType, CharacterType characterType, Action onFinish, string optionTalkerNameId = "", [Optional] Action onOpened, bool endSentenceImmediately = false, float autoPlaySpan = 0f, bool isCustomShowWaitInputMark = false)
//    Ola.UIPopupTalkerWidget
//    public void SetData(CharacterType characterType, string optionTalkerNameId)
//        private void SetupName(CharacterType characterType, string optionTalkerNameId)
Mono.setHook('', 'Ola.PopupView', 'Play', -1, {
    onEnter(args) {
        console.log('onEnter: PopupView.Play');
        const text = args[1];
        const characterType = args[3];

        const name = characterTypeToString(characterType);
        const s = text.readMonoString()
            .replace(/\[\/?CHARA_.*?\]/g, '')
            ;

        handlerLine(name + '\r\n' + s);
    }
});

// Ola.SubtitleWidget
// public void AddSubtitle(SoundType soundType, string soundName, float time, string text, string mapName = "")
Mono.setHook('', 'Ola.SubtitleWidget', 'AddSubtitle', -1, {
    onEnter(args) {
        console.log('onEnter: SubtitleWidget.AddSubtitle');
        const text = args[4];

        const s = text.readMonoString().replace(/<br>/g, ' ');

        handlerLine(s);
    }
});

// public void SetTextQuestion(string text)
Mono.setHook('', 'Ola.PopupChoiceView', 'SetTextQuestion', -1, {
    onEnter(args) {
        console.log('onEnter: PopupChoiceView.SetTextQuestion');
        const text = args[1];

        const s = text.readMonoString();

        handlerLine(s);
    }
});

// public void SetTextItemName(string text)
Mono.setHook('', 'Ola.UINormalItemElement', 'SetTextItemName', -1, {
    onEnter(args) {
        console.log('onEnter: UINormalItemElement.SetTextItemName');
        const text = args[1];

        const s = text.readMonoString();

        handlerLine(s);
    }
});

// public UIButtonGuideWidget SetText(string text)
Mono.setHook('', 'Ola.UIButtonGuideWidget', 'SetText', -1, {
    onEnter(args) {
        console.log('onEnter: UIButtonGuideWidget.SetText');
        const text = args[1];

        const s = text.readMonoString();

        handlerLine(s);
    }
});

const MasterData = Mono.use('', 'MasterData.MasterTextCollection');
const MasterTextCollection_address = MasterData.Localize.address;

// public void SetText(UIDiaryNormalItem.TextType type, string text)
Mono.setHook('', 'Ola.UIDiaryNormalItem', 'SetText', -1, {
    onEnter(args) {
        console.log('onEnter: UIDiaryNormalItem.SetText');

        const hook = Interceptor.attach(MasterTextCollection_address, {
            onLeave(retVal) {
                hook.detach();
                const s = retVal.readMonoString().replace(/<.*?>/g, '');;
                handlerLine(s);
            }
        })
    }
});

// public UISubMenuTextWidget SetText()
Mono.setHook('', 'Ola.SubMenu.UISubMenuTextWidget', 'SetText', -1, {
    onEnter(args) {
        console.log('onEnter: UISubMenuTextWidget.SetText');

        const s = args[0].wrap().uiText.ToString();

        handlerLine(s);
    }
});

// private void ChangeItemDetail(ItemView.CategoryType categoryType, ItemView.UIData uiData, bool isFocus = false)
Mono.setHook('', 'Ola.ItemView', 'ChangeItemDetail', -1, {
    onEnter(args) {
        console.log('onEnter: ItemView.ChangeItemDetail');

        const uiData = args[2].wrap();

        const name = uiData.get_TextItemName().readMonoString();
        const desc = uiData.get_TextItemDescription().readMonoString();

        handlerLine(name + '\r\n' + desc);
    }
});
