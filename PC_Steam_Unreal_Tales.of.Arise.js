// ==UserScript==
// @name         Tales of Arise
// @version      
// @author       Koukdw & [DC]
// @description  Steam
// * Bandai Namco Studios Inc.
// * Unreal Engine 4.18
//
// https://store.steampowered.com/app/740130/Tales_of_Arise/
// ==/UserScript==
const UE = require('./libUnrealEngine.js');
const {
    getObjectFullName
} = UE;

const PRINT_DEBUG = false;

const POINTER_SIZE = Process.pointerSize;
const handlerLine = trans.send((s) => s, '250+');
const handlerLineLast = trans.send((s) => s, 500);
let timer1;
function singleLine1(s) {
    clearTimeout(timer1);
    timer1 = setTimeout(() => {
        handlerLine(s);
    }, 490);
}

let timer2;
function singleLine2(s) {
    clearTimeout(timer2);
    timer2 = setTimeout(() => {
        handlerLine(s);
    }, 500);
}

let timer3;
function singleLine3(s) {
    clearTimeout(timer3);
    timer3 = setTimeout(() => {
        handlerLine(s);
    }, 510);
}

const pGetTextInternal = getGetTextInternal();

Breakpoint.add(UE.findFunction('/Script/AriseText.AriseTextWidget:SetText'), function () {
    const thiz = this.context.rcx;
    const ctx = getObjectFullName(thiz);
    let bp = Interceptor.attach(pGetTextInternal, {
        onEnter(args) {
            this.thiz = args[0].sub(0x100); // offset ModifiedText => AriseTextWidget instance
            this.output = args[1];
        },
        onLeave() {
            if (thiz.equals(this.thiz) === true) {
                bp.detach(); bp = null;
                let s = readSimpleString(this.output);
                if (
                    // Chat (Self)
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_LAYOUT_PF_C.WidgetTree.TO14_BPI_GUI_SYS_SCHT_ROOT.WidgetTree.Chat3.WidgetTree.TO14_BPI_GUI_SYS_SCHT_WIN2.WidgetTree.AriseTextWidget"
                    // Chat (Combat)
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.BPI_BTL_LAYOUT_ROOT_2_C.WidgetTree.ShortChatRoot.WidgetTree.Chat3.WidgetTree.TO14_BPI_GUI_SYS_SCHT_WIN2.WidgetTree.AriseTextWidget"
                    // Chat (Rest)
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_CMP_SCHT_C.WidgetTree.TO14_BPI_GUI_SYS_SCHT_ROOT.WidgetTree.Chat3.WidgetTree.TO14_BPI_GUI_SYS_SCHT_WIN2.WidgetTree.AriseTextWidget"
                ) {
                    s = cleanText(s);
                    handlerLine(s);
                }
                else if (PRINT_DEBUG === true) {
                    console.warn('onEnterSetText: ' + ctx);
                    console.warn(s);
                }
            }
        }
    });
    setTimeout(() => {
        if (bp !== null) {
            bp.detach();
        }
    }, 1000);
});

/*
Breakpoint.add(UE.findFunction('/Script/AriseText.AriseTextWidget:SetDictionaryText'), function () {
    const thiz = this.context.rcx;
    const ctx = getObjectFullName(thiz);
    console.warn('onEnterSetDictionaryText: ' + ctx);
    let bp = Interceptor.attach(pGetTextInternal, {
        onEnter(args) {
            this.thiz = args[0].sub(0x100); // offset ModifiedText => AriseTextWidget instance
            this.output = args[1];
        },
        onLeave() {
            if (thiz.equals(this.thiz) === true) {
                bp.detach(); bp = null;
                console.warn('onEnterGetText: ' + ctx);
                const s = readSimpleString(this.output);
                console.log(s);
            }
        }
    });
    setTimeout(() => {
        if (bp !== null) {
            bp.detach();
        }
    }, 1000);
});
//*/

Breakpoint.add(UE.findFunction('/Script/AriseText.AriseTextWidget:SetFDictionaryText'), function () {
    const thiz = this.context.rcx;
    const ctx = getObjectFullName(thiz);
    let bp = Interceptor.attach(pGetTextInternal, {
        onEnter(args) {
            this.thiz = args[0].sub(0x100); // offset ModifiedText => AriseTextWidget instance
            this.output = args[1];
        },
        onLeave() {
            if (thiz.equals(this.thiz) === true) {
                bp.detach(); bp = null;
                let s = readSimpleString(this.output);
                if (
                    // Full screen movie player subtitle
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.FullscreenMoviePlayerWidget_C.WidgetTree.SubtitlePanel.WidgetTree.FONT_SUBTITLE"
                    // Normal subtitle
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_SUBTITLE_C.WidgetTree.FONT_SUBTITLE"
                ) {
                    s = cleanText(s);
                    handlerLine(s);
                }
                // Rate limiting title
                else if (
                    // Skill Panel
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TIT2_C.WidgetTree.Exp.WidgetTree.FONT_TITLE"
                    // Field Guide
                    // Activity Records
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_QUE_C.WidgetTree.TO14_BPI_GUI_MNU_QUE_MAIN.WidgetTree.TO14_BPI_GUI_MNU_QUE_WIN.WidgetTree.AriseTextWidget"
                ) {
                    s = cleanText(s);
                    singleLine1(s);
                }
                // Rate limiting name
                else if (
                    // Skill Panel
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TIT2_C.WidgetTree.Exp.WidgetTree.FONT_NAME"
                    // Strategy
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TAG2_C.WidgetTree.DET.WidgetTree.FONT_NAME"
                    // Field Guide
                    // Activity Records
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_QUE_C.WidgetTree.TO14_BPI_GUI_MNU_QUE_MAIN.WidgetTree.TO14_BPI_GUI_MNU_QUE_WIN_EXP_MAIN.WidgetTree.AriseTextWidget"
                ) {
                    s = cleanText(s);
                    singleLine2(s);
                }
                // Rate limiting description
                else if (
                    // Artes
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_MAS_C.WidgetTree.TO14_BPI_GUI_MNU_MAS_DET_000.WidgetTree.FONT_EXP"
                    // Skill Panel
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TIT2_C.WidgetTree.Exp.WidgetTree.FONT_TEXT"
                    // Strategy
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TAG2_C.WidgetTree.DET.WidgetTree.FONT_TEXT"
                    // Field Guide
                    // Activity Records
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_QUE_C.WidgetTree.TO14_BPI_GUI_MNU_QUE_SUB.WidgetTree.TO14_BPI_GUI_MNU_QUE_WIN.WidgetTree.AriseTextWidget"
                ) {
                    s = cleanText(s);
                    singleLine3(s);
                }
                else if (PRINT_DEBUG === true) {
                    console.warn('onEnterSetFDictionaryText: ' + ctx);
                    console.warn(s);
                }
            }
        }
    });
    setTimeout(() => {
        if (bp !== null) {
            bp.detach();
        }
    }, 1000);
});

Breakpoint.add(UE.findFunction('/Script/AriseText.AriseTextWidget:SetModifiedText'), function () {
    const thiz = this.context.rcx;
    const ctx = getObjectFullName(thiz);
    if (ctx.endsWith('.Num') === true) return; // prevent crash
    let bp = Interceptor.attach(pGetTextInternal, {
        onEnter(args) {
            this.thiz = args[0].sub(0x100); // offset ModifiedText => AriseTextWidget instance
            this.output = args[1];
        },
        onLeave() {
            if (thiz.equals(this.thiz) === true) {
                bp.detach(); bp = null;
                let s = readSimpleString(this.output);
                if (
                    // Choices
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_SELECT_STR2_C.WidgetTree.Text"
                    // dialogue (name + text)
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_MSG_C.WidgetTree.TO14_BPI_GUI_SYS_MSG_BASE.WidgetTree.Name"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_MSG_C.WidgetTree.TO14_BPI_GUI_SYS_MSG_BASE.WidgetTree.Text"
                    // Loading Screen 
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_LOADING_001_C.WidgetTree.TO14_BPI_GUI_SYS_LOADING_TEXT.WidgetTree.FONT_MAIN"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_LOADING_001_C.WidgetTree.TO14_BPI_GUI_SYS_LOADING_TEXT.WidgetTree.FONT_EXP"
                    // Objective
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_LAYOUT_PF_C.WidgetTree.TO14_BPI_GUI_SYS_PF_NEXT.WidgetTree.FONT_NEXT"
                    // Pick up item title + description
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_WIN_LAYOUT_C.WidgetTree.ITEM_EXP.WidgetTree.FONT_NAME"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_WIN_LAYOUT_C.WidgetTree.ITEM_EXP.WidgetTree.FONT_TEXT"
                    // in game tutorial (side)
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.BPI_BTL_LAYOUT_TUTORIAL_ROOT_C.WidgetTree.TutorialRoot.WidgetTree.PlayableHelpTitle"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.BPI_BTL_LAYOUT_TUTORIAL_ROOT_C.WidgetTree.TutorialRoot.WidgetTree.PlayableHelpExplanation"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_LAYOUT_PF_C.WidgetTree.TO14_BPI_GUI_SYS_TUTORIAL_PLAYABLE.WidgetTree.Title"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_LAYOUT_PF_C.WidgetTree.TO14_BPI_GUI_SYS_TUTORIAL_PLAYABLE.WidgetTree.Exp"
                    // special tutorial window (center)
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_HLP_TUT_C.WidgetTree.TO14_BPI_GUI_MNU_COL_HLP_WIN00.WidgetTree.TITLE_TEXT"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_HLP_TUT_C.WidgetTree.TO14_BPI_GUI_MNU_COL_HLP_WIN00.WidgetTree.Desc"
                    // Pop up info
                    //|| ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_WIN_LAYOUT_C.WidgetTree.WIN.WidgetTree.Title.WidgetTree.Title"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_SYS_WIN_LAYOUT_C.WidgetTree.WIN.WidgetTree.Exp"
                ) {
                    s = cleanText(s);
                    handlerLine(s);
                }
                // Rate limiting title
                else if (
                    // Field Guide
                    // Activity Records
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_QUE_C.WidgetTree.TO14_BPI_GUI_MNU_QUE_MAIN.WidgetTree.TO14_BPI_GUI_MNU_QUE_WIN.WidgetTree.AriseTextWidget"
                ) {
                    s = cleanText(s);
                    singleLine1(s);
                }
                // Rate limiting name
                else if (
                    // Artes
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_MAS_C.WidgetTree.TO14_BPI_GUI_MNU_MAS_DET_000.WidgetTree.FONT_NAME"
                    // Menu item
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_ITM_C.WidgetTree.TO14_BPI_GUI_MNU_EQU_DET_000.WidgetTree.FONT_NAME"
                    // Skill Panel
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TIT2_C.WidgetTree.Exp.WidgetTree.FONT_NAME"
                    // Equipment
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_EQU_C.WidgetTree.DET.WidgetTree.FONT_NAME"
                    // Outfit
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_EQU2_C.WidgetTree.TO14_BPI_GUI_MNU_EQU_DET_001.WidgetTree.FONT_NAME"
                    // Field Guide
                    // Activity Records
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_QUE_C.WidgetTree.TO14_BPI_GUI_MNU_QUE_SUB.WidgetTree.TO14_BPI_GUI_MNU_QUE_WIN.WidgetTree.AriseTextWidget"
                    // Help
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_HLP_C.WidgetTree.TO14_BPI_GUI_MNU_COL_HLP_WIN00.WidgetTree.TITLE_TEXT"
                    // Glossary
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_KEY_C.WidgetTree.TO14_BPI_GUI_MNU_COL_KEY_WIN00.WidgetTree.Name"
                ) {
                    s = cleanText(s);
                    singleLine2(s);
                }
                // Rate limiting description
                else if (
                    // Menu Item
                    ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_ITM_C.WidgetTree.TO14_BPI_GUI_MNU_EQU_DET_000.WidgetTree.FONT_TEXT"
                    // Skill Panel
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_TIT2_C.WidgetTree.Exp.WidgetTree.FONT_TEXT"
                    // Equipement
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_EQU_C.WidgetTree.DET.WidgetTree.FONT_TEXT"
                    // Outfit
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_EQU2_C.WidgetTree.TO14_BPI_GUI_MNU_EQU_DET_001.WidgetTree.FONT_TEXT"
                    // Activity Records
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_QUE_C.WidgetTree.TO14_BPI_GUI_MNU_QUE_SUB.WidgetTree.TO14_BPI_GUI_MNU_QUE_WIN_EXP_SUB.WidgetTree.TO14_BPI_GUI_MNU_QUE_LIST_000_STR.WidgetTree.Name"
                    // Help
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_HLP_C.WidgetTree.TO14_BPI_GUI_MNU_COL_HLP_WIN00.WidgetTree.Desc"
                    // Glossary
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_KEY_C.WidgetTree.TO14_BPI_GUI_MNU_COL_KEY_WIN00.WidgetTree.Font"
                    || ctx === "/Engine/Transient.GameEngine.BP_AriseGameInstance_C.TO14_BPI_GUI_MNU_COL_KEY_C.WidgetTree.TO14_BPI_GUI_MNU_COL_KEY_WIN00.WidgetTree.FONT2"
                ) {
                    s = cleanText(s);
                    singleLine3(s);
                }
                else if (PRINT_DEBUG === true) {
                    console.warn('onEnterSetModifiedText: ' + ctx);
                    console.warn(s);
                }
            }
        }
    });
    setTimeout(() => {
        if (bp !== null) {
            bp.detach();
        }
    }, 1000);
});

/**
 * 
 * @param {string} s 
 * @returns {string}
 */
function cleanText(s) {
    return s
        .replace(/\n+/g, ' ') // single line
        .replace(/<PAGE>/g, '\r\n\r\n')
        .replace(/<Button id=\"([^\"]+)../g, '$1') // keep button ID
        .replace(/<CharaName id=\"([^\"]+)../g, '$1') // keep char ID
        .replace(/<\/?[^>]*./g, ''); // remove all html tag
}

/**
 * 
 * @param {NativePointer} address
 * @returns {string}
 */
function readSimpleString(address) {
    const length = address.add(POINTER_SIZE).readU32();
    if (length === 0) return '';

    return address.readPointer().readUtf16String(length - 1);
}

//// Demo
/*
function getGetTextInternal() {
    const vmGetTextInternal = UE.findFunction('/Script/AriseText.AriseTextWidget:GetTextInternal');
    let ins = Instruction.parse(vmGetTextInternal);
    while (ins.mnemonic !== 'call') {
        ins = Instruction.parse(ins.next);
    }
    return ptr(ins.opStr);
}
//*/

//// Retail
function getGetTextInternal() {
    const vmGetTextInternal = UE.findFunction('/Script/AriseText.AriseTextWidget:GetTextInternal');
    let ins = Instruction.parse(vmGetTextInternal);
    while (ins.mnemonic !== 'call') {
        ins = Instruction.parse(ins.next);
    }
    console.log(ins.address);
    // 1st call
    const nativeGetTextInternal = ptr(ins.opStr);
    ins = Instruction.parse(nativeGetTextInternal);
    while (ins.mnemonic !== 'call') {
        ins = Instruction.parse(ins.next);
    }
    console.log(ins.address);
    // 2nd call
    ins = Instruction.parse(ins.next);
    while (ins.mnemonic !== 'call') {
        ins = Instruction.parse(ins.next);
    }
    console.log(ins.address);
    return ptr(ins.opStr);
}