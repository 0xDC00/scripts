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
const handlerLineLast = trans.send((s) => s, 500);

UE.setHook('/Script/Phoenix.PhoenixTextBlock:SetTextKey', {
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
        //console.log('onEnter SetTextKey: ' + ctx);
        console.log('onEnter SetTextKey: ');
        const s = ptext.readFTextString();

        if (// Map
            // City Tooltip title
            // World Map
            ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_OverlandMapScreen_C.WidgetTree.mapToolTip.WidgetTree.tooltipTitle'
            // Hogwarts Map
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_HogwartsMapScreen_C.WidgetTree.mapToolTip.WidgetTree.tooltipTitle'
            // Hogsmeade Map
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_HogsmeadeMapScreen_C.WidgetTree.mapToolTip.WidgetTree.tooltipTitle'

            // Field Guide
            // Quest 
            // Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Quests.WidgetTree.UI_BP_FG_QuestsScreen_C.WidgetTree.selectedQuestDetails.WidgetTree.MissionTitle'

            // Field Guide 
            // Inventory
            // Item Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Inventory.WidgetTree.UI_BP_FG_InventoryScreen_C.WidgetTree.detailsPanel.WidgetTree.itemHeader.WidgetTree.itemTitle'
            // Item Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Inventory.WidgetTree.UI_BP_FG_InventoryScreen_C.WidgetTree.detailsPanel.WidgetTree.detailsDescription'

            // Field Guide 
            // Gear
            // Item Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Gear.WidgetTree.UI_BP_FG_GearScreen_C.WidgetTree.gearTooltip.WidgetTree.itemTitle'
            // Item Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Gear.WidgetTree.UI_BP_FG_GearScreen_C.WidgetTree.gearTooltip.WidgetTree.itemDesc'
            // Item Rarity
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Gear.WidgetTree.UI_BP_FG_GearScreen_C.WidgetTree.gearTooltip.WidgetTree.ItemType'

            // Field Guide 
            // Collections
            // Category Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Collections.WidgetTree.UI_BP_FG_Collections_C.WidgetTree.mainCategoryTitle'
            // Category Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Collections.WidgetTree.UI_BP_FG_Collections_C.WidgetTree.mainCategoryDescription'
            // Subject Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Collections.WidgetTree.UI_BP_FG_Collections_C.WidgetTree.collectionDetails.WidgetTree.subjectTitle'
            // Subject Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Collections.WidgetTree.UI_BP_FG_Collections_C.WidgetTree.collectionDetails.WidgetTree.categoryDesc'

            // Field guide
            // Talents
            // Talent Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Talents.WidgetTree.UI_BP_FG_TalentsScreen_C.WidgetTree.talentDetails.WidgetTree.talentTitle'
            // Talent Requirements
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Talents.WidgetTree.UI_BP_FG_TalentsScreen_C.WidgetTree.talentDetails.WidgetTree.tatentRequirementText'

            // Spell Selection Menu
            // Spell Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_ActionSelection_PC_C.WidgetTree.ActionSelection_MKB.WidgetTree.Details.WidgetTree.spellTitle'
            // Spell Type
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_ActionSelection_PC_C.WidgetTree.ActionSelection_MKB.WidgetTree.Details.WidgetTree.spellTypeLabel'

            // Vendor Menu
            // Item Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.itemTitle'
            // Item Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.detailsDescription'
            // Gear Title
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.gearHeader.WidgetTree.gearTitle'
            // Gear Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.gearDesc'
            // Gear Rarity
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.gearHeader.WidgetTree.gearRarityTitle'
        ) {
            handlerLine(s);
        }
        // Uncomment to show all text (to create filters)
        // else {
        //     console.warn(ctx);
        //     console.warn(s);
        // }
    }
});

UE.setHook('/Script/Phoenix.PhoenixRichTextBlock:SetTextKey', {
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
        //console.log('onEnter RSetTextKey: ' + ctx);
        console.log('onEnter RSetTextKey: ');
        const s = ptext.readFTextString();

        if (// Map
            // City Tooltip Description
            // World Map
            ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_OverlandMapScreen_C.WidgetTree.mapToolTip.WidgetTree.tooltipDesc'
            // Hogwarts Map
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_HogwartsMapScreen_C.WidgetTree.mapToolTip.WidgetTree.tooltipDesc'
            // Hogsmeade Map
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_HogsmeadeMapScreen_C.WidgetTree.mapToolTip.WidgetTree.tooltipDesc'

            // Loading Screen
            // Tip Text
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_NewLoadingScreen_C.WidgetTree.TipText'

            // Field Guide
            // Inventory 
            // Letter Body
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_RichPaper_C.WidgetTree.Letter.WidgetTree.BodyText'

            // Field Guide
            // Quest 
            // Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Quests.WidgetTree.UI_BP_FG_QuestsScreen_C.WidgetTree.selectedQuestDetails.WidgetTree.MissionDescription'

            // Field Guide
            // Owlpost 
            // Letter Body
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_OwlMail.WidgetTree.UI_BP_FG_OwlMailScreen_C.WidgetTree.RichPaper.WidgetTree.Letter.WidgetTree.BodyText'

            // Field Guide
            // Talent 
            // Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Talents.WidgetTree.UI_BP_FG_TalentsScreen_C.WidgetTree.talentDetails.WidgetTree.TalentDescText'

            // HUD 
            // Hint text
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_PhoenixHUDWidget_C.WidgetTree.HintHud.WidgetTree.HintText'

            // Spell Selection Menu
            // Spell Description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_ActionSelection_PC_C.WidgetTree.ActionSelection_MKB.WidgetTree.Details.WidgetTree.spellDescription'

            // Tutorial
            // NonModal Body
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Tutorial_NonModal_C.WidgetTree.tutorialBody'
            // Modal Body
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Tutorial_Modal_C.WidgetTree.modalBody'

            // Mission Banner
            // Description Text
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_PhoenixHUDWidget_C.WidgetTree.UI_BP_MissionBanner_New.WidgetTree.MissionDesc_Text'
        ) {
            handlerLine(s);
        }
        // Uncomment to show all text (to create filters)
        // else {
        //     console.warn(ctx);
        //     console.warn(s);
        // }
    }
});

UE.setHook('/Script/Phoenix.PhoenixRichTextBlock:SetPhoenixText', {
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
        //console.log('onEnter RSetPhoenixText: ' + ctx);
        console.log('onEnter RSetPhoenixText: ');
        const s = ptext.readFTextString();
        // Choices (repeat again)
        if (ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_InteractButton_C.WidgetTree.DisplayText') {
            handlerLine(s);
        }
        // Uncomment to show all text (to create filters)
        // else {
        //     console.warn(ctx);
        //     console.warn(s);
        // }
    }
});

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
        //console.log('onEnter RichTextBlock:SetText: ' + ctx);
        console.log('onEnter RichTextBlock:SetText: ');
        //console.log(hexdump(ptext.readPointer()));
        let s = ptext.readFTextString();
        if (// Main Subtitle
            ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Subtitle_Element_C.WidgetTree.Text_Element') {
            s = s
                .replace(/^<Name_Text>/, '')
                .replace(':</> ', '\r\n')
                ;
            handlerLine(s);
        }
        else if (
            // Field Guide
            // Quest
            // Objective Text
            ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_FieldGuide_C.WidgetTree.Async_FG_Quests.WidgetTree.UI_BP_FG_QuestsScreen_C.WidgetTree.selectedQuestDetails.WidgetTree.UI_BP_QuestObjective_C.WidgetTree.objectiveText'
        ) {
            handlerLine(s);
        }
        else if (
            // Mission Banner
            // CheckBox Text
            ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_MissionBannerCheckbox_C.WidgetTree.CheckboxText'
        ) {
            handlerLine(s);
        }
        // Uncomment to show all text (to create filters)
        // else {
        //     console.warn(ctx);
        //     console.warn(s);
        // }
    }
});

/*
UE.setHookSetText('/Script/UMG.TextBlock:SetText', {
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
        if (// Store item title
            ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.itemTitle'
            // Store item description
            || ctx === '/Engine/Transient.GameEngine.BP_PhoenixGameInstance_C.UI_BP_Vendor_C.WidgetTree.itemDetails.WidgetTree.detailsDescription'
        ) {
            console.log('onEnter [NATIVE] TextBlock:SetText: ' + ctx);
            const s = ptext.readFTextString();
            handlerLine(s);
        }
    }
}); //*/