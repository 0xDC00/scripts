// ==UserScript==
// @name         Persona 5 Tactica
// @version      
// @author       koukdw
// @description  Steam
// * Atlus
// * Unity (il2cpp)
//
// https://store.steampowered.com/app/2254740/Persona_5_Tactica/
// ==/UserScript==

const Mono = require('./libMono.js');

const handlerLine = trans.send((s) => s, '250+');

/*

class TalkEvent.MessageWindowViewController : UnityEngine.MonoBehaviour
{
    System.Collections.Generic.List<UnityEngine.GameObject> m_MessageWindowViewList; // 0x18
    System.Collections.Generic.List<TalkEvent.IMessageWindowView> m_IMessageWindowViewList; // 0x20
    TalkEvent.BackLogViewController m_BackLogViewController; // 0x28
    TalkEvent.ButtonHelpController m_ButtonHelpController; // 0x30
    TalkEvent.ReportController m_ReportController; // 0x38
    TalkEvent.ITalkEventPause m_ITalkEventPause; // 0x40
    System.Boolean m_IsMessageWait; // 0x48
    System.Collections.Generic.Dictionary<System.Int32,System.String> m_AnimeList; // 0x50
    TalkEvent.MessageWindowViewController.MessageWindowPositionType m_PositionType; // 0x58
    TalkEvent.MessageWindowViewController.WindowTailPositionType m_TailPositionType; // 0x5c
    UnityEngine.Vector3 m_TailSearchFollowPos; // 0x60
    static System.Int32 TEXT_FONT_SIZE = 72;
    static System.Int32 SHOUT_FONT_SIZE = 100;
    System.String m_NowMessage; // 0x70
    System.String m_AddMessage; // 0x78
    TalkEvent.CharaNameData m_Name; // 0x80
    System.Threading.CancellationTokenSource m_MessageShowToken; // 0x88
    System.Threading.CancellationTokenSource m_MessageVoiceToken; // 0x90
    System.Single m_TextDisplayTime; // 0x98
    System.Single m_EndMessageWaitSec; // 0x9c
    System.Boolean m_IsEndMessageShow; // 0xa0
    System.Boolean m_IsShowStartingMessage; // 0xa1
    System.Boolean m_IsShowingMessage; // 0xa2
    System.Threading.CancellationToken m_CancellationTokenOnDestroy; // 0xa8
}
class TalkEvent.CharaNameData : System.Object
{
    System.Int32 <NameId>k__BackingField; // 0x10
    System.String CharaName; // 0x18
    System.String CharaLogName; // 0x20
    System.Void .ctor(System.Int32 id, System.String charaName, System.String charaLogName); // 0x03894290
    System.Int32 get_NameId(); // 0x005451e0
    System.Void set_NameId(System.Int32 value); // 0x0051f0d0
}

public void SetMessage(
    MessageWindowViewController this,                   [0]
    PPScriptManager scriptManager,                      [1]
    ICharaFaceMouthTalk charaView,                      [2]
    CutinCharaView cutinView,                           [3]
    ICharaFaceMouthTalk charaView2,                     [4]
    CutinCharaView cutinView2,                          [5]
    IUnitView unitView,                                 [6]
    Sprite namePlate,                                   [7]
    string message,                                     [8]
    string logMessage,                                  [9]
    int windowType,                                     [10]
    string voiceId,                                     [11]
    Entity_sound_database.Param soundData,              [12]
    ReportController.UpdateReportData updateReportData, [13]
    CharaTalkMouthController.MouthLock mouthLockData,   [14]
    SBScriptTalkEventGlobal.SkipMode skipMode,          [15]
    bool isMessageWait                                  [16]
    )
*/

Mono.setHook('_Dev', 'TalkEvent.MessageWindowViewController', 'SetMessage', -1, {
    onEnter(args) {
        console.log('onEnter: TalkEvent.MessageWindowViewController.SetMessage');
        const msg_controller = args[0].wrap();  // NativePointer => MonoObjectWrapper
        const m_Name = msg_controller.m_Name.wrap(); // Get the m_Name field (CharaNameData type) => MonoObjectWrapper
        const name = m_Name.CharaName.value.replace(/<.*?>/g, '')
        const message = args[8].readMonoString().replace(/<.*?>/g, '');
        handlerLine(`${name} \r\n ${message}`);
    }
});

// Timeline.CutsceneMovieTextController::SetMessageText(this = Cutscene (Timeline.CutsceneMovieTextController), name = "Ryuji", message = "Dammit—get yer—mitts off me!")

Mono.setHook('_Dev', 'Timeline.CutsceneMovieTextController', 'SetMessageText', -1, {
    onEnter(args) {
        const name = args[1].readMonoString();
        const message = args[2].readMonoString();
        if (message == "") return;
        console.log('onEnter: Timeline.CutsceneMovieTextController::SetMessageText');
        handlerLine(`${name} \r\n ${message}`);
    }
});

// Timeline.AnimeMovieTextController::SetAnimeMessageText(this = Anime (Timeline.AnimeMovieTextController), name = "Marie", message = "Heh! You can't even pick yourself up, huh? That's what happens when you defy me.")

Mono.setHook('_Dev', 'Timeline.AnimeMovieTextController', 'SetAnimeMessageText', -1, {
    onEnter(args) {
        const name = args[1].readMonoString();
        const message = args[2].readMonoString();
        if (message == "") return;
        console.log('onEnter: Timeline.AnimeMovieTextController::SetAnimeMessageText');
        handlerLine(`${name} \r\n ${message}`);
    }
});

//TalkEvent.SelectItemView::SetText(this = ItemLong(Clone) (TalkEvent.SelectItemView), text = "Need some curry too?

Mono.setHook('_Dev', 'TalkEvent.SelectItemView', 'SetText', -1, {
    onEnter(args) {
        console.log('onEnter: TalkEvent.SelectItemView::SetText');
        const text = args[1].readMonoString();
        handlerLine(text);
    }
});