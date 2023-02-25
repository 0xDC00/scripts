// ==UserScript==
// @name         Hogwarts Legacy
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// * Avalanche Software
// * Unreal Engine 4
//
// https://store.steampowered.com/app/990080/Hogwarts_Legacy/
// ==/UserScript==
const UE = require('./libUnrealEngine.js');
const {
    getObjectFullName
} = UE;

const handlerLine = trans.send((s) => s, '250+');

UE.setHookSetText('/Script/UMG.RichTextBlock:SetText', function (thiz, s) {
    const ctx = getObjectFullName(thiz);
    console.log('onEnter: ' + ctx);

    if (ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Subtitle_Element_C.WidgetTree.Text_Element') {
        s = s.replace(/^<Name_Text>/, '')
            .replace(':</> ', '\r\n')
            ;
        handlerLine(s);
    }
    else if (ctx === ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_MissionBannerCheckbox_C.WidgetTree.CheckboxText') {
        handlerLine(s);
    }
    else {
        console.warn(s);
    }
});