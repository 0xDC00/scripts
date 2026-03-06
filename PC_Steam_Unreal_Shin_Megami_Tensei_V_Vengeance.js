// ==UserScript==
// @name         Shin Megami Tensei V: Vengeance
// @version      1.0.3a
// @author       Musi
// @description  Steam
// * ATLUS
// * SEGA
//
// https://store.steampowered.com/app/1875830/Shin_Megami_Tensei_V_Vengeance/
// ==/UserScript==

const UE = require("./libUnrealEngine.js");
const { getObjectFullName } = UE;

const handlerLine = trans.send((s) => s, "250+");
const lastSent = {};
let lastHook = "";

function handleHook(thiz, hookName, noDedup = false) {
  let ctx = "";
  let s = "";
  try { ctx = getObjectFullName(thiz); } catch(e) { return; }
  try { s = thiz.add(0x128).readFTextString(); } catch(e) { return; } //offset
  if (!s || s.length === 0) return;
  s = s.replace(/<[^>]*>/g, "").trim();
  if (!s || s.length === 0) return;
  if (s.startsWith("NOT USED:")) return;  // this appears in some quest text
  if (!noDedup && lastSent[ctx] === s) return;
  lastSent[ctx] = s;
  lastHook = hookName;
  handlerLine(s);
}

UE.setHook("/Script/Project.MessageRichTextWidget:GetVoiceName", {
  onEnter(args) {
    this.thiz = args[0];
  },
  onLeave(retVal) {
    const thiz = this.thiz;
    let ctx = "";
    try { ctx = getObjectFullName(thiz); } catch(e) { return; }
    if (
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MessageRichText" || // textboxes
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_Message_C.WidgetTree.WB_Message_Normal.WidgetTree.ScriptMessage" // cutscene dialogue
    ) {
      handleHook(thiz, "GetVoiceName");
    }
  },
});

UE.setHook("/Script/Project.MessageRichTextWidget:RevealPageText", {
  onEnter(args) {
    this.thiz = args[0];
  },
  onLeave(retVal) {
    const thiz = this.thiz;
    let ctx = "";
    try { ctx = getObjectFullName(thiz); } catch(e) { return; }
    if (
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_DialogWindow_C.WidgetTree.MessageRichTextDialog" || // menu popup text
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_DialogWindow_C.WidgetTree.WB_DialogSelectMenu.WidgetTree.WB_DialogSelect0.WidgetTree.selectmessagerichtext" || // top choice on menu popup
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_DialogWindow_C.WidgetTree.WB_DialogSelectMenu.WidgetTree.WB_DialogSelect1.WidgetTree.selectmessagerichtext" || // bottom choice on menu popup
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_TutorialWindow2_C.WidgetTree.WB_MainText.WidgetTree.MessageRichText" || // tutorials
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_Loading_C.WidgetTree.WB_MultiLineRichText.WidgetTree.MessageRichText" || // loading screen tips
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_Quest2_C.WidgetTree.WB_SummaryText.WidgetTree.MessageRichText" // || // quest description
      // ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_CommonHelpWindow_C.WidgetTree.MessageRichTextHelp" // help text (this is probably considered too spammy for most people, feel free to uncomment if you want the text)
    ) {
      handleHook(thiz, "RevealPageText", true); // skip dedup here since these are mostly yes/no questions
    }
  },
});

UE.setHook("/Script/UMG.TextBlock:SetColorAndOpacity", {
  onEnter(args) {
    this.thiz = args[0];
  },
  onLeave(retVal) {
    const thiz = this.thiz;
    let ctx = "";
    try { ctx = getObjectFullName(thiz); } catch(e) { return; }
    if (
      // choices
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect0.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect1.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect2.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect3.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect4.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect5.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect6.WidgetTree.SimpleText" ||
      ctx === "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C.WidgetTree.MsgSelectMenu.WidgetTree.WB_MsgSelect7.WidgetTree.SimpleText"
    ) {
      handleHook(thiz, "SetColorAndOpacity", true); // skip dedup since choices can be the same multiple times in a row.
    }
  },
});

/*
// these hooks run every frame when a textbox is open.
UE.setHook("", {
// /Game/Blueprints/Battle/FrameWork/Talk/Blueprints/BP_TalkCtrl.BP_TalkCtrl_C:Evt_TalkStartBranch
// /Game/Blueprints/UI/PartyPanel/WB_CharaPanel.WB_CharaPanel_C:SetCharaNameText
// /Game/Blueprints/UI/PartyPanel/BP_CharaPanel.BP_CharaPanel_C:SetCharaNameText
// /Script/Project.BPL_CharaNameData:GetCharaName
// /Game/Blueprints/UI/Message/WB_Message_Base.WB_Message_Base_C:StartMessage
// /Game/Blueprints/UI/Message/WB_Message.WB_Message_C:Choice_StartMessage_Lebel
// /Game/Blueprints/UI/Message/WB_Message.WB_Message_C:Choice_AddPage
// /Game/Blueprints/UI/Message/WB_Message.WB_Message_C:Choice_AddPage_Label
// /Game/Blueprints/UI/Message/WB_Message.WB_Message_C:Choice_StartMessage
// /Game/Blueprints/Event/Common/BP_EventBase.BP_EventBase_C:MovieText
  onEnter(args) {
    this.thiz = args[0];
    this.a2 = args[2];
  },
  onLeave(retVal) {
    let ctx = "";
    try { ctx = getObjectFullName(this.thiz); } catch(e) { return; }
    if (ctx !== "/Engine/Transient.ProjectGameEngine.ProjectGameInstance_C.WB_MsgWindow_C") return;
    let s = "";
    try { s = this.a2.readFTextString(); } catch(e) { return; }
    if (!s || s.length === 0 || lastSent[ctx] === s) return;
    lastSent[ctx] = s;
    handlerLine(s);
  },
});
*/
