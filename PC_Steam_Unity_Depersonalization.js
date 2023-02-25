// ==UserScript==
// @name         Depersonalization
// @version      
// @author       [DC]
// @description  Steam
// * MeowNature
// * Unity (JIT)
//
// https://store.steampowered.com/app/1477070/Depersonalization/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 250);

// public async Task PlayVoice(string role, string content, bool isWait = false)
Mono.setHook('', '.AudioManager', 'PlayVoice', -1, {
    onEnter(args) {
        console.log('onEnter: AudioManager.PlayVoice');

        //const role = args[1].readMonoString(); // rokeKey
        const content = args[2].readMonoString();
        const s = content.replace(/<.*?>/g, ''); // trim html tag

        handlerLine(s);
    }
});

// public void FreshTipText(string text = "")
Mono.setHook('', '.FXSearchtip', 'FreshTipText', -1, {
    onEnter(args) {
        console.log('onEnter: FXSearchtip.FreshTipText');

        const s = args[1].readMonoString();
        if (s === '') return;

        trans.send(s);
    }
});

const GetDes = Mono.use('', '.BattleHelper').GetDes.overload('ERoleExtraAttribute');

Mono.use('', '.UIDetailedTipPanel').Open.overload('System.String,UnityEngine.Vector3,System.String,ETipAlignmentType').attach({
    onEnter(args) {
        console.log('onEnter: Open1');

        this.thiz = args[0].wrap();
    },
    onLeave() {
        const thiz = this.thiz;
        const Text_ItemName = thiz.Text_ItemName.wrap().get_text().readMonoString();
        const Text_NameContent = thiz.Text_NameContent.wrap().get_text().readMonoString();
        const Text_NameTitle = thiz.Text_NameTitle.wrap().get_text().readMonoString();

        const s = Text_NameTitle + '\r\n' + Text_ItemName + '\r\n' + Text_NameContent;

        handlerLineLast(s);
    }
});

Mono.use('', '.UIDetailedTipPanel').Open.overload('ERoleExtraAttribute,UnityEngine.Vector3,UnityEngine.Vector3,ETipAlignmentType').attach({
    onEnter(args) {
        console.log('onEnter: Open2');
        this.thiz = args[0].wrap();
        const thiz = this;
        const bp = Interceptor.attach(GetDes.address, {
            onLeave(retVal) {
                bp.detach();
                thiz.Text_NameContent = retVal.readMonoString();
            }
        });
    },
    onLeave() {
        const thiz = this.thiz;
        const Text_ItemName = thiz.Text_ItemName.wrap().get_text().readMonoString();
        //const Text_NameContent = thiz.Text_NameContent.wrap().get_text().readMonoString();
        const Text_NameContent = this.Text_NameContent;
        const Text_NameTitle = thiz.Text_NameTitle.wrap().get_text().readMonoString();

        const s = Text_NameTitle + '\r\n' + Text_ItemName + '\r\n' + Text_NameContent;
        handlerLineLast(s);
    }
});

// public void Open(MOD_Dynamic_Item itemData, Vector3 tarOriginPos, Vector3 offestPos, ETipAlignmentType alignmentType = ETipAlignmentType.Center)
// public void SetItemDescription(MOD_Dynamic_Item item)
Mono.setHook('', '.UIDetailedTipPanel', 'SetItemDescription', -1, {
    onEnter(args) {
        console.log('onEnter: UIDetailedTipPanel.SetItemDescription');

        const thiz = args[0].wrap();
        const Text_ItemName = thiz.Text_ItemName.wrap().get_text().readMonoString();
        //const Text_NameContent = thiz.Text_NameContent.wrap().get_text().readMonoString();
        //const Text_NameTitle = thiz.Text_NameTitle.wrap().get_text().readMonoString();

        //const s = Text_NameTitle + '\r\n' + Text_ItemName + '\r\n' + Text_NameContent;

        const item = args[1].wrap();
        const desc = item.GetFullDescribe().readMonoString().replace(/<.*?>/g, '');

        const s = Text_ItemName + '\r\n' + desc;

        handlerLineLast(s);
    }
});

// public void SetButtonText(string tarStr) //
Mono.setHook('', '.UIOptionOperationElement', 'SetButtonText', -1, {
    onEnter(args) {
        console.log('onEnter: UIOptionOperationElement.SetButtonText');

        this.thiz = args[0];
    },
    onLeave(retval) {
        const thiz = this.thiz.wrap();
        const s = thiz.Text_Select.wrap().get_text().readMonoString();

        handlerLine(s);
    }
});

Mono.setHook('', '.UIMapViewPanel', 'UpdataNodeDec', -1, {
    onEnter(args) {
        console.log('onEnter: UIMapViewPanel.UpdataNodeDec');

        this.thiz = args[0];
    },
    onLeave(retVal) {
        const thiz = this.thiz.wrap();
        const Text_PosTitTxt = thiz.Text_PosTitTxt.wrap().get_text().readMonoString();
        const Text_PosTarTxt = thiz.Text_PosTarTxt.wrap().get_text().readMonoString();
        const Text_PosTarInfoTxt = thiz.Text_PosTarInfoTxt.wrap().get_text().readMonoString();

        const s = Text_PosTitTxt + '\r\n' + Text_PosTarTxt + '\r\n' + Text_PosTarInfoTxt;

        trans.send(s);
    }
});
