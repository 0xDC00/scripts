// ==UserScript==
// @name         Like a Dragon: Ishin!
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// * Ryu Ga Gotoku Studio
// * Unreal Engine 4
//
// https://store.steampowered.com/agecheck/app/1805480/
// ==/UserScript==
const UE = require('./libUnrealEngine.js');
const {
    getObjectFullName,
    getObjectId
} = UE;

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 250);
const previous = {};

UE.setHookSetText('/Script/UMG.RichTextBlock:SetText', function (thiz, s) {
    const ctx = getObjectFullName(thiz);
    console.log('onEnter: ' + ctx);

    if (ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_WindowTalk_C.WidgetTree.WBP_WindowAdvTalk.WidgetTree.WBP_WindowTalkWindow.WidgetTree.asc_info_01') {
        handlerLine(s);
    }
    else if (ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_TitleMenu_C.WidgetTree.WBP_TitleMenuMenuInfo.WidgetTree.ASC_text_01'
        || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_TitleMenu_C.WidgetTree.WBP_TitleMenuSelectMenu.WidgetTree.select_menu_description'
    ) {
        handlerLineLast(s);
    }
    else if (ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_Window_Choice_C.WidgetTree.WBP_Window_Choice.WidgetTree.WBP_Window_Btn_Cursor_C.WidgetTree.V_text') {
        const oid = getObjectId(thiz);
        const pre = previous[oid];
        if (pre !== s) {
            previous[oid] = s;
            handlerLine(s);
        }
    }
    else {
        console.warn(s);
    }
});