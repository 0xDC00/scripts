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
    getObjectFullName
} = UE;

const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 500);

UE.setHook('/Script/UMG.RichTextBlock:SetText', {
    onEnter(args) {
        const thiz = args[0];
        this.thiz = thiz;
        this.text = thiz.add(0x128).readPointer();
    },
    onLeave(retVal) {
        const thiz = this.thiz;
        const ptext = thiz.add(0x128);
        const text = ptext.readPointer();
        if (text.equals(this.text) === true) {
            return;
        }

        const ctx = getObjectFullName(thiz);
        console.log('onEnter RichTextBlock: ' + ctx);
        let s = ptext.readFTextString();

        if (// subtitle
            ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_WindowTalk_C.WidgetTree.WBP_WindowAdvTalk.WidgetTree.WBP_WindowTalkWindow.WidgetTree.asc_info_01'
        ) {
            s = s.replace(/<.*?>/g, '');
            if (s.length === 0) return;
            handlerLine(s);
        }
        else if (ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_TitleMenu_C.WidgetTree.WBP_TitleMenuMenuInfo.WidgetTree.ASC_text_01'
            || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_TitleMenu_C.WidgetTree.WBP_TitleMenuSelectMenu.WidgetTree.select_menu_description'
            || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_MainMenuMap_C.WidgetTree.WBP_pjd2_pause_map_bg.WidgetTree.MacanRichTextBlock'
            || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_MainMenu_C.WidgetTree.Info_TextWindow.WidgetTree.WBP_MainMenu_Info_TextWindow_01Text.WidgetTree.asc_info'
            || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_MainMenu_Item_C.WidgetTree.WBP_MainMenu_Info_TextWindow.WidgetTree.WBP_MainMenu_Info_TextWindow_02_Item.WidgetTree.asc_info'
            // settings
            || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_MainMenuSetting_C.WidgetTree.WBP_SettingMenuCategory.WidgetTree.WBP_SettingCommonDetail.WidgetTree.asc_setting_description'
        ) {
            handlerLineLast(s);
        }
        else if (
            // choice
            ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_Window_Choice_C.WidgetTree.WBP_Window_Choice.WidgetTree.WBP_Window_Btn_Cursor_C.WidgetTree.V_text'
            || ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_TaishiIkuseiTopMenuInfo_C.WidgetTree.info_text'
        ) {
            handlerLine(s);
        }
        else {
            console.warn(s);
        }
    }
});

// UE.setHook('/Script/UMG.TextBlock:SetText', {
//     onEnter(args) {
//         const thiz = args[0];
//         this.thiz = thiz;
//         this.text = thiz.add(0x128).readPointer();
//     },
//     onLeave(retVal) {
//         const thiz = this.thiz;
//         const ptext = thiz.add(0x128);
//         const text = ptext.readPointer();
//         if (text.equals(this.text) === true) {
//             return;
//         }

//         const ctx = getObjectFullName(thiz);
//         if (// name
//             ctx === '/Engine/Transient.GameEngine.BP_CommonGameInstance_C.WBP_Main_WindowTalk_C.WidgetTree.WBP_WindowAdvTalk.WidgetTree.WBP_WindowTalkWindowName.WidgetTree.asc_name_00') {
//             console.log('onEnter TextBlock: ' + ctx);
//             let s = ptext.readFTextString();
//             if (s.length === 0) return;
//             handlerLine(s);
//         }
//     }
// });
